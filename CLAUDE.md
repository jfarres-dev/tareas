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

All logic lives in `/js/` as vanilla ES modules loaded via `<script type="module">` in `index.html`.

| File | Role |
|------|------|
| `js/supabase.js` | Supabase client (URL + anon key) |
| `js/auth.js` | Login, register, logout, session management |
| `js/habits.js` | Habit CRUD — soft-delete via `is_active` flag |
| `js/logs.js` | Daily log entries, date helpers, stats |
| `js/ui.js` | All rendering (innerHTML-based, no templating engine) |
| `js/app.js` | App state, routing between views, event wiring, bootstrap |

**Views** (toggled by CSS class on `#app`): `view-auth`, `view-onboarding`, `view-app`. Tabs inside `view-app`: today, calendar, stats, profile. The detail overlay slides in from the right; create/edit uses a modal.

**Data model** (Supabase, schema in `setup.sql`):
- `habits`: name, icon, color, type (`binary`/`count`/`duration`), goal, frequency, unit, `is_active`
- `habit_logs`: habit_id, date, value — one row per habit per day

Row-level security is active; all queries are scoped to the authenticated user.

**Service worker** (`sw.js`): cache-first for app shell assets, bypasses Supabase/Auth/CDN requests.

**Icons**: 14 SVG stroke icons defined in `assets/icons.js` as a plain JS object.

## Design system

CSS custom properties in `style.css`. Key tokens:
- Background: `--bg` `#f4f1ec`, `--bg-warm` `#fbf8f3`
- Accent: `oklch(0.62 0.10 145)` (green)
- Fonts: Instrument Serif (headings), Geist (UI), Geist Mono
