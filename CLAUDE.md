# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Hábitos** — a Spanish-language PWA for daily habit tracking. Vanilla JS + HTML/CSS frontend, Supabase (PostgreSQL + Auth) as backend. No build step; static files served directly.

Live at: `https://jfarres-dev.github.io/tareas/`

## Dev server

```bash
npx serve -l 5173 .
```

No build, no bundler. Changes are visible on page reload. No test suite.

## Deployment

Automatic via GitHub Actions (`.github/workflows/static.yml`) on push to `master`. Deploys to GitHub Pages.

## Architecture

All logic lives in `/js/` as classic scripts (global functions, no modules) loaded in order in `index.html`. Inline `onclick`/`oninput` handlers call these globals.

| File | Role |
|------|------|
| `js/supabase.js` | Supabase client (URL + anon key) |
| `js/auth.js` | Login, register, logout, session management |
| `js/habits.js` | Habit CRUD — soft-delete via `is_active` flag (private per user) |
| `js/logs.js` | Daily log entries, date helpers, stats |
| `js/family.js` | Profiles, family (núcleo familiar) membership, invite codes |
| `js/tasks.js` | Shared assigned tasks CRUD + auto icon picker |
| `js/shopping.js` | Shared shopping list CRUD + categories |
| `js/ui.js` | All rendering (innerHTML-based, no templating engine) |
| `js/app.js` | App state, routing between views, event wiring, bootstrap |
| `assets/qrcodegen.js` | Vendored Nayuki QR generator (MIT) for invite QR codes |

**Views** (toggled by `.hidden` class): `view-auth`, `view-onboarding`, `view-app`. Tabs inside `view-app` (bottom nav): `home` (Inicio), `tasks` (Tareas), `shopping` (Compra), `habits` (Hábitos, with Hoy/Todos segmented sub-tabs), plus a center FAB that opens the quick-add sheet (Tarea / Artículo / Hábito). Overlays slide in from the right (`overlay-detail`, `overlay-create`, `overlay-members`); sheets slide up (`sheet-profile`, `sheet-value`, `sheet-quick`, `sheet-add`).

**Data model** (Supabase; base schema in `setup.sql`, family features in `family.sql`):
- `habits`: name, icon, color, type (`binary`/`count`/`duration`), goal, frequency, unit, `is_active` — private per user
- `habit_logs`: habit_id, date, value — one row per habit per day — private per user
- `profiles`: id (= auth uid), name, color — auto-created by trigger on signup
- `families` / `family_members`: one family per user (unique index), role `adult`
- `family_invites`: code `FAM-XXXXXX`, 72 h expiry — created via RPC only
- `family_tasks`: title, icon, assignee_id, due_date, done — shared within family. Rows with `frequency` set are recurring templates; their daily instances carry `template_id` (created lazily client-side in `ensureTaskInstances`, deduped by a partial unique index)
- `shopping_items`: name, qty, category (`frutas`/`lacteos`/`panaderia`/`limpieza`/`otros`), checked, added_by — shared within family

Row-level security is active. Private tables scope by `auth.uid() = user_id`; shared tables use `security definer` helpers (`is_family_member`, `shares_family_with`) to avoid RLS recursion. Create/join/invite go through `security definer` RPCs (`create_family`, `join_family_with_code`, `create_family_invite`) which raise token errors (`ALREADY_IN_FAMILY`, `INVALID_CODE`, `NOT_IN_FAMILY`) mapped to Spanish toasts in `js/family.js`.

Invite links: `https://…/tareas/?invite=FAM-XXXXXX` — parsed in `init()`, opens the join sheet after login/signup.

**Service worker** (`sw.js`): cache-first for app shell assets (keep `SHELL_ASSETS` in sync when adding files), bypasses Supabase/Auth/CDN requests. Cache name stamped with deploy time by GitHub Actions.

**Icons**: SVG stroke icons defined in `assets/icons.js` (`ICON_PATHS`, `$c` = color placeholder).

## Design system

CSS custom properties in `style.css`. Key tokens:
- Background: `--bg` `#f4f1ec`, `--bg-warm` `#fbf8f3`
- Accent: `oklch(0.62 0.10 145)` (green)
- Fonts: Instrument Serif (headings), Geist (UI), Geist Mono
