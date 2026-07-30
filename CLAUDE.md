# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Hábitos** — a Spanish-language PWA for daily habit tracking plus shared household tasks and shopping list. Vanilla JS + HTML/CSS frontend, Supabase (PostgreSQL + Auth) as backend. No build step; static files served directly.

Live at: `https://jfarres-dev.github.io/tareas/`

All user-facing strings and code comments are in Spanish. Keep it that way.

## Dev server

```bash
npx serve -l 5173 .
```

Also configured in `.claude/launch.json` as `habitos` (use `preview_start` with that name). No build, no bundler, no linter — changes are visible on page reload.

Tests cover only the pure date helpers in `js/logs.js`, via Node's built-in runner (no dependencies):

```bash
node --test tests/dates.test.js
```

`node --test tests/` fails on this machine (Git Bash mangles the directory arg), so pass the file. `tests/` is not part of the app — keep it out of `index.html` and `SHELL_ASSETS`. Since the sources are classic scripts with no exports, the test evaluates `js/logs.js` inside a `vm` context and can freeze "now" to probe specific local times.

## Deployment

Automatic via GitHub Actions (`.github/workflows/static.yml`) on push to `master`; the whole repo is uploaded to GitHub Pages. The workflow `sed`s `__DEPLOY_TIME__` in `sw.js` into a timestamp, which is what busts the service worker cache.

Database changes are **not** deployed. `setup.sql` and `family.sql` are run by hand in the Supabase SQL Editor. Both are written to be re-runnable (`create table if not exists`, `create or replace function`, `add column if not exists`, `not valid` constraints); append migrations to the bottom rather than editing existing statements.

## Architecture

All logic lives in `/js/` as classic scripts — global `function` declarations, no modules, no bundler. Load order matters and is fixed in `index.html`. Inline `onclick`/`oninput` attributes in generated HTML call these globals; there are almost no `addEventListener` calls outside `init()`.

| File | Role |
|------|------|
| `assets/icons.js` | `ICON_PATHS` + `icon()` SVG builder, **and** shared constants: `HABIT_COLORS`, `colorById`, `normalizeHabitColor`, `WEEKDAYS`/`WEEKDAYS_LONG`/`MONTHS`, `isoDay` (Mon=0) |
| `js/supabase.js` | Client init (URL + publishable key) with a 15 s `fetchWithTimeout` wrapper so a dead network fails loudly instead of hanging |
| `js/auth.js` | Thin `supabaseClient.auth` wrappers — **currently dead code**; `app.js` calls `supabaseClient.auth` directly everywhere |
| `js/habits.js` | Habit CRUD — delete is a soft delete via `is_active` |
| `js/logs.js` | Log read/write, date helpers (see below), frequency scheduling, `enrichHabit`, streak/rate stats |
| `js/family.js` | Profiles, family membership, invite RPCs, `familyErrorMessage` |
| `js/tasks.js` | Shared task CRUD, recurring-instance materialization, keyword→icon rules |
| `js/shopping.js` | Shopping list CRUD, `SHOP_CATEGORIES` |
| `js/ui.js` | Every `render*`/`build*` function. String-concatenated `innerHTML`, no templating engine |
| `js/app.js` | Global mutable state, routing, all event handlers, bootstrap (`init()` runs at the bottom of the file) |
| `assets/qrcodegen.js` | Vendored Nayuki QR generator (MIT) for invite QR codes |

### Rendering model

State lives as module-global `let`s at the top of `app.js` (`currentUser`, `habits`, `allLogs`, `family`, `familyMembers`, `familyTasks`, `shoppingItems`, plus `draft`/`taskDraft`/`itemDraft` for in-progress forms). There is no reactivity: handlers mutate state, then call **`renderCurrentTab()`**, which dispatches to the right `render*` in `ui.js`. Each `render*` replaces a container's entire `innerHTML`.

Consequences to respect when editing:
- Any user-supplied string interpolated into HTML must go through `_esc()` (`ui.js`). This is the only XSS defense.
- New handlers must be globals reachable from an inline attribute; nothing is scoped.
- Since no transpiler runs, only syntax Safari/iOS ships natively is safe. Existing code sticks to `function(){}` callbacks, `var` inside functions, `Object.assign` over spread, and no optional chaining — match it.

### Views and navigation

Views are toggled by the `.hidden` class via `showView()`: `view-auth`, `view-onboarding`, `view-app`. Inside `view-app`, `switchTab()` sets `currentTab` — `home` (Inicio), `tasks` (Tareas), `shopping` (Compra), `habits` (Hábitos, with Hoy/Todos sub-tabs) — plus a center FAB opening the quick-add sheet (Tarea / Artículo / Hábito). Overlays slide in from the right (`overlay-detail`, `overlay-create`, `overlay-members`); sheets slide up (`sheet-profile`, `sheet-value`, `sheet-quick`, `sheet-add`).

### Data model

Base schema in `setup.sql`, family features in `family.sql`.

- `habits` — name, icon, color, `type` (`binary`/`count`/`duration`), `goal`, `unit`, `frequency` (jsonb), `is_active`. Private per user.
- `habit_logs` — `habit_id`, `user_id`, **`log_date`**, **`completed`** (bool), **`value`** (int); `unique(habit_id, log_date)`. Private per user. Writes are read-then-update-or-insert (`toggleLog`, `setLogValue`), not upserts.
- `profiles` — id (= auth uid), name, color. Created by the `on_auth_user_created` trigger; `ensureProfile` is a client-side safety net.
- `families` / `family_members` — one family per user, enforced by `idx_member_single_family`. Role is always `adult`. A trigger deletes a family when its last member leaves.
- `family_invites` — code `FAM-XXXXXX`, 72 h expiry, **single use** (`used_at`/`used_by`), created via RPC only. `idx_invite_active_family` enforces at most one unused invite per family, so `create_family_invite` returns the live code instead of minting a second one.
- `family_tasks` — title, icon, `assignee_id`, `due_date`, `done`. Shared within family. Rows **with** `frequency` are recurring templates; rows **without** are one-offs or generated instances carrying `template_id`.
- `shopping_items` — name, qty, category (`frutas`/`lacteos`/`panaderia`/`limpieza`/`otros`), checked, `added_by`. Shared within family.

**Frequency jsonb** is used by both habits and task templates: `{kind:'daily'}`, `{kind:'weekdays', days:[0..6]}` (Monday = 0, via `isoDay`), and for habits only `{kind:'per-week'|'per-month', n}`. `isScheduledOn` treats per-week/per-month as "every day is a potential slot", so those habits never look skipped. `isTaskScheduledOn` supports only `daily` and `weekdays`.

**Recurring task instances** are materialized client-side, not by a cron job: `ensureTaskInstances` (called from `fetchFamilySharedData` on every load/refresh) inserts today's missing instance per template. Concurrent clients racing is expected and absorbed — the partial unique index `idx_task_instance_day` raises `23505`, which the code swallows.

### Dates

Every date in the app is a `'YYYY-MM-DD'` **local-time** key — `habit_logs.log_date`, `family_tasks.due_date`, and the keys of the `habit.log` map built by `buildLogMap`. `toDateString()` in `js/logs.js` is the single source of that format; `fmtKey()` is a legacy alias that delegates to it.

Two rules, both learned from real bugs:

- **Never use `toISOString()` to derive a day key.** It returns UTC, so between midnight and 02:00 Spanish summer time it names the previous day. That's what made `handleCheck` write a log under yesterday's key while the streak and heatmap looked for today's.
- **Never add `86400000` ms to move a day.** DST days are 23 or 25 hours long, so on the October changeover that lands back on the same date. Use `tomorrow()`, or `setDate(getDate() + n)` as `daysAgo()` does — calendar arithmetic, not millisecond arithmetic.

`tests/dates.test.js` pins both rules, including the DST changeovers. If you touch these helpers, run it.

### Row-level security

Active on every table. Private tables scope by `auth.uid() = user_id`. Shared tables go through `security definer` helpers (`is_family_member`, `shares_family_with`) to avoid RLS recursion. Create/join/invite/revoke go through `security definer` RPCs (`create_family`, `join_family_with_code`, `create_family_invite`, `revoke_family_invite`) that `raise exception` with token strings — `ALREADY_IN_FAMILY`, `INVALID_CODE`, `CODE_USED`, `NOT_IN_FAMILY`, `INVALID_NAME`, `NOT_AUTHENTICATED` — mapped to Spanish toasts by `familyErrorMessage` in `js/family.js`.

Invite links: `https://…/tareas/?invite=FAM-XXXXXX`, parsed in `init()`, opening the join sheet after login/signup.

`join_family_with_code` consumes the code with a single atomic `update … where used_at is null … returning family_id`, so two people redeeming the same code concurrently means only one wins. Don't refactor that into a `select` followed by an `update` — that reintroduces the race. The membership check runs first so a redemption that fails with `ALREADY_IN_FAMILY` doesn't burn the code.

### Error, offline, and loading conventions

Follow these when adding any async handler:
- Wrap in `try/catch`, `console.error` the raw error, and toast a Spanish message through **`errMsg(fallback)`** — it substitutes an offline-specific message when `navigator.onLine` is false. Auth errors go through `authErrorMessage`, family RPC errors through `familyErrorMessage`.
- Toggle handlers (`handleToggleTask`, `handleToggleItem`) update state optimistically, re-render, then **roll back and re-render** on failure.
- Long-running buttons show a `.btn-spinner`; `setAuthLoading()` is the pattern (stash the label in `dataset.label`, disable, restore on error).
- `init()` registers `online`/`offline` listeners that toast and refetch, and a `visibilitychange` listener that silently refreshes shared family data.
- The family block in `loadDashboard()` is deliberately wrapped in its own `try/catch`: if `family.sql` has not been run, the tables 404 and the app must still work as a solo habit tracker. Don't let family failures break the habits path.
- Supabase signup returns a phantom user with `identities: []` when the email already exists; `handleAuthSubmit` detects that and reports `USER_EXISTS`. Email confirmation is enabled, so signup with no session renders `renderAuthEmailSent()` instead of the dashboard.

### Service worker

`sw.js` is cache-first for app shell assets only. Add every new JS/CSS file to `SHELL_ASSETS` or it will not be available offline. Supabase, Google Fonts, and jsDelivr origins are explicitly never intercepted, nor is any non-GET request. It calls `skipWaiting` + `clients.claim`; `index.html` listens for `controllerchange` and calls `showUpdateToast()` to prompt a reload.

`localStorage` keys in use: `habitos-theme`, `habitos-onboarded`.

## Design system

CSS custom properties in `style.css` (single ~62 kB file, sections delimited by `/* ── name ── */` comments). Light theme on `:root`, dark theme on `html[data-theme="dark"]`, set from `currentTheme` in `app.js`. When adding a themed component, define the color via a token rather than a literal, or add a matching `html[data-theme="dark"] .your-class` rule.

- Background `--bg` `#f4f1ec`, paper `--paper` `#fbf8f3`, surface `--surface` `#ffffff`
- Accent `oklch(0.62 0.10 145)` (green); `--warm`, `--danger` for secondary states
- Fonts: Instrument Serif (headings, italic `em` for emphasis), Geist (UI), Geist Mono
- Habit/profile colors come from `HABIT_COLORS` in `assets/icons.js` and are stored as ids (e.g. `sage`), never hex
