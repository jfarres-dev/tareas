-- ============================================================
-- HabitBox — Supabase SQL Setup
-- Ejecuta este script en: Supabase > SQL Editor > New Query
-- ============================================================

-- 1. Tabla de hábitos
create table if not exists habits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  icon       text not null default '⭐',
  color      text not null default '#6366f1',
  type       text check (type in ('binary', 'count')) not null default 'binary',
  goal       integer,
  created_at date not null default current_date,
  is_active  boolean not null default true
);

-- 2. Tabla de registros diarios
create table if not exists habit_logs (
  id         uuid primary key default gen_random_uuid(),
  habit_id   uuid references habits(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  log_date   date not null,
  completed  boolean not null default false,
  value      integer not null default 0,
  unique(habit_id, log_date)
);

-- 3. Row Level Security
alter table habits     enable row level security;
alter table habit_logs enable row level security;

-- 4. Policies (cada usuario solo ve y modifica sus propios datos)
drop policy if exists "user owns habits"     on habits;
drop policy if exists "user owns habit_logs" on habit_logs;

create policy "user owns habits"
  on habits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user owns habit_logs"
  on habit_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. Índices para rendimiento
create index if not exists idx_habits_user     on habits(user_id);
create index if not exists idx_logs_habit_date on habit_logs(habit_id, log_date);
create index if not exists idx_logs_user_date  on habit_logs(user_id, log_date);
