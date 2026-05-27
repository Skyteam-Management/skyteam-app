-- 0007 — updated_at + historial (audit log) + rolling 30-day purge.
-- Idempotent. Wrapped in a transaction.
--
-- Three pieces:
--   1. updated_at column on lideres / paquetes / clientes, auto-maintained.
--   2. historial table that records insert / update / delete on those tables,
--      including the actor (email pulled from auth.users at trigger time).
--   3. pg_cron schedule that deletes historial rows older than 30 days every day.
--      pg_cron must be enabled in Supabase first (Database → Extensions → pg_cron).

begin;

-- ============================================================
-- 1. updated_at + auto-update trigger
-- ============================================================
alter table lideres  add column if not exists updated_at timestamptz not null default now();
alter table paquetes add column if not exists updated_at timestamptz not null default now();
alter table clientes add column if not exists updated_at timestamptz not null default now();

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end$$ language plpgsql;

drop trigger if exists trg_set_updated_at_lideres  on lideres;
drop trigger if exists trg_set_updated_at_paquetes on paquetes;
drop trigger if exists trg_set_updated_at_clientes on clientes;

create trigger trg_set_updated_at_lideres
  before update on lideres
  for each row execute function set_updated_at();

create trigger trg_set_updated_at_paquetes
  before update on paquetes
  for each row execute function set_updated_at();

create trigger trg_set_updated_at_clientes
  before update on clientes
  for each row execute function set_updated_at();

-- ============================================================
-- 2. historial table
-- ============================================================
create table if not exists historial (
  id            bigint generated always as identity primary key,
  tabla         text not null check (tabla in ('lideres', 'paquetes', 'clientes')),
  registro_id   text not null,
  accion        text not null check (accion in ('insert', 'update', 'delete')),
  actor_id      uuid,
  actor_email   text,
  datos         jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists idx_historial_created_at on historial(created_at desc);
create index if not exists idx_historial_tabla_registro on historial(tabla, registro_id, created_at desc);
create index if not exists idx_historial_actor on historial(actor_id, created_at desc);

alter table historial enable row level security;

drop policy if exists "authenticated read historial" on historial;
create policy "authenticated read historial"
  on historial for select
  to authenticated
  using (true);

-- Inserts come from triggers, which run with the table's privileges. We DO NOT
-- grant insert to authenticated directly — only triggers should write here.

-- ============================================================
-- 3. audit trigger functions — one per table
-- ============================================================
create or replace function audit_lideres() returns trigger as $$
declare
  v_actor_id    uuid := auth.uid();
  v_actor_email text;
begin
  if v_actor_id is not null then
    select email into v_actor_email from auth.users where id = v_actor_id;
  end if;

  if tg_op = 'INSERT' then
    insert into historial (tabla, registro_id, accion, actor_id, actor_email, datos)
      values ('lideres', new.id, 'insert', v_actor_id, v_actor_email, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into historial (tabla, registro_id, accion, actor_id, actor_email, datos)
      values ('lideres', new.id, 'update', v_actor_id, v_actor_email, to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into historial (tabla, registro_id, accion, actor_id, actor_email, datos)
      values ('lideres', old.id, 'delete', v_actor_id, v_actor_email, to_jsonb(old));
    return old;
  end if;
  return null;
end$$ language plpgsql security definer;

create or replace function audit_paquetes() returns trigger as $$
declare
  v_actor_id    uuid := auth.uid();
  v_actor_email text;
begin
  if v_actor_id is not null then
    select email into v_actor_email from auth.users where id = v_actor_id;
  end if;

  if tg_op = 'INSERT' then
    insert into historial (tabla, registro_id, accion, actor_id, actor_email, datos)
      values ('paquetes', new.id, 'insert', v_actor_id, v_actor_email, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into historial (tabla, registro_id, accion, actor_id, actor_email, datos)
      values ('paquetes', new.id, 'update', v_actor_id, v_actor_email, to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into historial (tabla, registro_id, accion, actor_id, actor_email, datos)
      values ('paquetes', old.id, 'delete', v_actor_id, v_actor_email, to_jsonb(old));
    return old;
  end if;
  return null;
end$$ language plpgsql security definer;

create or replace function audit_clientes() returns trigger as $$
declare
  v_actor_id    uuid := auth.uid();
  v_actor_email text;
begin
  if v_actor_id is not null then
    select email into v_actor_email from auth.users where id = v_actor_id;
  end if;

  if tg_op = 'INSERT' then
    insert into historial (tabla, registro_id, accion, actor_id, actor_email, datos)
      values ('clientes', new.id, 'insert', v_actor_id, v_actor_email, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into historial (tabla, registro_id, accion, actor_id, actor_email, datos)
      values ('clientes', new.id, 'update', v_actor_id, v_actor_email, to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into historial (tabla, registro_id, accion, actor_id, actor_email, datos)
      values ('clientes', old.id, 'delete', v_actor_id, v_actor_email, to_jsonb(old));
    return old;
  end if;
  return null;
end$$ language plpgsql security definer;

drop trigger if exists trg_audit_lideres  on lideres;
drop trigger if exists trg_audit_paquetes on paquetes;
drop trigger if exists trg_audit_clientes on clientes;

create trigger trg_audit_lideres
  after insert or update or delete on lideres
  for each row execute function audit_lideres();

create trigger trg_audit_paquetes
  after insert or update or delete on paquetes
  for each row execute function audit_paquetes();

create trigger trg_audit_clientes
  after insert or update or delete on clientes
  for each row execute function audit_clientes();

-- ============================================================
-- 4. Update clientes_view to expose updated_at
-- ============================================================
create or replace view clientes_view as
select
  c.id,
  c.nombre,
  c.telefono,
  c.lider,
  c.paquete,
  c.fecha_inicio,
  c.created_at,
  c.updated_at,
  p.nombre   as paquete_nombre,
  p.dias     as paquete_dias,
  case
    when c.fecha_inicio is null or p.dias is null then null
    else (c.fecha_inicio + (p.dias || ' days')::interval)::date
  end as fecha_vencimiento,
  case
    when c.fecha_inicio is null or p.dias is null then false
    else (c.fecha_inicio + (p.dias || ' days')::interval) < now()
  end as expirado,
  l.nombre   as lider_nombre,
  l.apellido as lider_apellido
from clientes c
left join paquetes p on p.id = c.paquete
left join lideres  l on l.id = c.lider;

alter view clientes_view set (security_invoker = true);

-- ============================================================
-- 5. Purge — rolling 30 days via pg_cron
-- ============================================================
-- A plain function so the app (or a manual run) can also call it.
create or replace function purge_historial_antiguo() returns integer as $$
declare
  deleted_count integer;
begin
  delete from historial where created_at < now() - interval '30 days';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end$$ language plpgsql;

-- Schedule with pg_cron. If the extension isn't enabled this block fails
-- with a clear message — enable it from Supabase dashboard:
-- Database → Extensions → search "pg_cron" → enable.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    -- Remove any previous schedule with the same name (idempotent).
    perform cron.unschedule(jobid) from cron.job where jobname = 'purge_historial_diario';
    perform cron.schedule(
      'purge_historial_diario',
      '0 3 * * *',                          -- every day at 03:00 UTC
      $cmd$ select purge_historial_antiguo(); $cmd$
    );
  else
    raise notice 'pg_cron is not enabled. Enable it from Supabase dashboard (Database → Extensions) and re-run this migration to install the daily purge schedule.';
  end if;
end$$;

commit;
