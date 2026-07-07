-- ============================================================
-- Hábitos — Funcionalidades familiares (núcleo familiar)
-- Ejecutar una vez en: Supabase > SQL Editor > New Query
-- No modifica las tablas existentes (habits, habit_logs).
-- ============================================================

-- 1. Perfiles públicos (visibles entre miembros de la misma familia)
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null default '' check (char_length(name) <= 60),
  color      text,
  created_at timestamptz not null default now()
);
alter table profiles enable row level security;

-- 2. Familias
create table if not exists families (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 40),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
alter table families enable row level security;

-- 3. Miembros (v1: una familia por usuario)
create table if not exists family_members (
  family_id uuid not null references families(id) on delete cascade,
  user_id   uuid not null references profiles(id) on delete cascade,
  role      text not null default 'adult' check (role in ('adult')),
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id)
);
create unique index if not exists idx_member_single_family on family_members(user_id);
alter table family_members enable row level security;

-- 4. Invitaciones por código
create table if not exists family_invites (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id) on delete cascade,
  code       text not null unique,
  created_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table family_invites enable row level security;

-- 5. Tareas asignadas
--    Una fila con frequency != null es una *plantilla recurrente*; sus
--    instancias diarias se crean con template_id apuntando a la plantilla.
create table if not exists family_tasks (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 80),
  icon        text not null default 'check',
  assignee_id uuid references profiles(id) on delete set null,
  due_date    date not null default current_date,
  done        boolean not null default false,
  done_at     timestamptz,
  frequency   jsonb,
  template_id uuid references family_tasks(id) on delete cascade,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
-- Por si la tabla ya existía de una versión anterior de este script:
alter table family_tasks add column if not exists frequency jsonb;
alter table family_tasks add column if not exists template_id uuid references family_tasks(id) on delete cascade;
create index if not exists idx_tasks_family_due on family_tasks(family_id, due_date);
-- Evita instancias duplicadas de la misma plantilla el mismo día (carrera entre 2 clientes)
create unique index if not exists idx_task_instance_day on family_tasks(template_id, due_date) where template_id is not null;
alter table family_tasks enable row level security;

-- 6. Lista de la compra
create table if not exists shopping_items (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 60),
  qty        text check (qty is null or char_length(qty) <= 20),
  category   text not null default 'otros'
             check (category in ('frutas','lacteos','panaderia','limpieza','otros')),
  checked    boolean not null default false,
  added_by   uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_shopping_family on shopping_items(family_id, created_at);
alter table shopping_items enable row level security;

-- 7. Helpers security definer (evitan recursión de RLS en family_members)
create or replace function is_family_member(fam uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from family_members
    where family_id = fam and user_id = auth.uid()
  );
$$;

create or replace function shares_family_with(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from family_members a
    join family_members b on a.family_id = b.family_id
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

-- 8. Policies
drop policy if exists "profiles select" on profiles;
drop policy if exists "profiles insert own" on profiles;
drop policy if exists "profiles update own" on profiles;
create policy "profiles select" on profiles for select
  using (id = auth.uid() or shares_family_with(id));
create policy "profiles insert own" on profiles for insert
  with check (id = auth.uid());
create policy "profiles update own" on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "families member select" on families;
drop policy if exists "families member update" on families;
create policy "families member select" on families for select
  using (is_family_member(id));
create policy "families member update" on families for update
  using (is_family_member(id)) with check (is_family_member(id));
-- insert/delete solo vía RPC / trigger (security definer)

drop policy if exists "members select" on family_members;
drop policy if exists "members leave" on family_members;
create policy "members select" on family_members for select
  using (is_family_member(family_id));
create policy "members leave" on family_members for delete
  using (user_id = auth.uid());
-- insert solo vía RPC

drop policy if exists "invites member select" on family_invites;
drop policy if exists "invites member delete" on family_invites;
create policy "invites member select" on family_invites for select
  using (is_family_member(family_id));
create policy "invites member delete" on family_invites for delete
  using (is_family_member(family_id));
-- insert solo vía RPC (el código se genera en servidor)

drop policy if exists "family tasks all" on family_tasks;
create policy "family tasks all" on family_tasks for all
  using (is_family_member(family_id)) with check (is_family_member(family_id));

drop policy if exists "family shopping all" on shopping_items;
create policy "family shopping all" on shopping_items for all
  using (is_family_member(family_id)) with check (is_family_member(family_id));

-- 9. RPCs
create or replace function create_family(family_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare fam uuid;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if exists (select 1 from family_members where user_id = auth.uid()) then
    raise exception 'ALREADY_IN_FAMILY';
  end if;
  if family_name is null or char_length(trim(family_name)) = 0 then
    raise exception 'INVALID_NAME';
  end if;
  insert into families (name, created_by)
  values (trim(family_name), auth.uid()) returning id into fam;
  insert into family_members (family_id, user_id) values (fam, auth.uid());
  return fam;
end $$;

create or replace function create_family_invite()
returns json language plpgsql security definer set search_path = public as $$
declare
  fam uuid; new_code text; exp timestamptz; i int;
  chars constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
begin
  select family_id into fam from family_members where user_id = auth.uid();
  if fam is null then raise exception 'NOT_IN_FAMILY'; end if;
  loop
    new_code := 'FAM-';
    for i in 1..6 loop
      new_code := new_code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from family_invites where code = new_code);
  end loop;
  exp := now() + interval '72 hours';
  insert into family_invites (family_id, code, created_by, expires_at)
  values (fam, new_code, auth.uid(), exp);
  return json_build_object('code', new_code, 'expires_at', exp);
end $$;

create or replace function join_family_with_code(invite_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare inv record;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if exists (select 1 from family_members where user_id = auth.uid()) then
    raise exception 'ALREADY_IN_FAMILY';
  end if;
  select * into inv from family_invites
  where code = upper(trim(invite_code)) and expires_at > now();
  if inv is null then raise exception 'INVALID_CODE'; end if;
  insert into family_members (family_id, user_id) values (inv.family_id, auth.uid());
  return inv.family_id;
end $$;

revoke all on function create_family(text) from public, anon;
revoke all on function create_family_invite() from public, anon;
revoke all on function join_family_with_code(text) from public, anon;
grant execute on function create_family(text) to authenticated;
grant execute on function create_family_invite() to authenticated;
grant execute on function join_family_with_code(text) to authenticated;

-- 10. Borrar familia huérfana cuando sale el último miembro
create or replace function cleanup_empty_family()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from family_members where family_id = old.family_id) then
    delete from families where id = old.family_id;
  end if;
  return old;
end $$;
drop trigger if exists trg_cleanup_empty_family on family_members;
create trigger trg_cleanup_empty_family
after delete on family_members
for each row execute function cleanup_empty_family();

-- 11. Auto-crear perfil al registrarse + backfill de usuarios existentes
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''),
                           split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

insert into profiles (id, name)
select id, coalesce(nullif(trim(raw_user_meta_data->>'name'), ''), split_part(email, '@', 1))
from auth.users
on conflict (id) do nothing;
