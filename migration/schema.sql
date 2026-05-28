-- Target schema for fresh installs.
-- For existing databases, apply migrations/0002-*.sql incrementally instead.

create table if not exists lideres (
  id          text primary key,
  nombre      text not null,
  apellido    text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint lideres_nombre_apellido_key unique (nombre, apellido)
);

create table if not exists paquetes (
  id          text primary key,
  nombre      text not null unique,
  dias        integer not null check (dias > 0),
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists clientes (
  id            text primary key,
  nombre        text not null,
  telefono      text,
  lider         text references lideres(id) on delete set null,
  paquete       text references paquetes(id) on delete set null,
  fecha_inicio  date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint clientes_unique_business_key
    unique nulls not distinct (nombre, telefono, lider, fecha_inicio)
);

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

create index if not exists idx_historial_created_at      on historial(created_at desc);
create index if not exists idx_historial_tabla_registro  on historial(tabla, registro_id, created_at desc);
create index if not exists idx_historial_actor           on historial(actor_id, created_at desc);

create index if not exists idx_clientes_lider   on clientes(lider);
create index if not exists idx_clientes_paquete on clientes(paquete);

-- Default catalog
insert into paquetes (id, nombre, dias) values
  ('13', '8 DÍAS',   8),
  ('14', '15 DÍAS',  15),
  ('5',  '1 MES',    31),
  ('12', '2 MESES',  60),
  ('4',  '3 MESES',  91),
  ('11', '4 MESES',  121),
  ('10', '5 MESES',  151),
  ('3',  '6 MESES',  182),
  ('9',  '7 MESES',  212),
  ('8',  '8 MESES',  243),
  ('2',  '9 MESES',  273),
  ('7',  '10 MESES', 304),
  ('6',  '11 MESES', 334),
  ('1',  '12 MESES', 365)
on conflict (id) do nothing;

-- RLS
alter table lideres   enable row level security;
alter table paquetes  enable row level security;
alter table clientes  enable row level security;
alter table historial enable row level security;

create policy "authenticated full access on lideres"
  on lideres for all
  to authenticated
  using (true) with check (true);

create policy "authenticated full access on paquetes"
  on paquetes for all
  to authenticated
  using (true) with check (true);

create policy "authenticated full access on clientes"
  on clientes for all
  to authenticated
  using (true) with check (true);

-- Historial: read-only for the app. Writes happen exclusively via triggers.
create policy "authenticated read historial"
  on historial for select
  to authenticated
  using (true);

-- Enriched view: paquete name, lider name, fecha_vencimiento and expirado
-- are derived here so business logic doesn't drift between callers.
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

-- Auto-upper case all name/text fields on insert/update so the DB is the source
-- of truth for normalization (matches the appUppercase directive in the UI).
create or replace function uppercase_lideres() returns trigger as $$
begin
  new.nombre   := upper(new.nombre);
  new.apellido := upper(new.apellido);
  return new;
end$$ language plpgsql;

create or replace function uppercase_paquetes() returns trigger as $$
begin
  new.nombre := upper(new.nombre);
  return new;
end$$ language plpgsql;

create or replace function uppercase_clientes() returns trigger as $$
begin
  new.nombre := upper(new.nombre);
  if new.telefono is not null then
    new.telefono := upper(new.telefono);
  end if;
  return new;
end$$ language plpgsql;

create trigger trg_uppercase_lideres
  before insert or update on lideres
  for each row execute function uppercase_lideres();

create trigger trg_uppercase_paquetes
  before insert or update on paquetes
  for each row execute function uppercase_paquetes();

create trigger trg_uppercase_clientes
  before insert or update on clientes
  for each row execute function uppercase_clientes();

-- updated_at — auto-maintained on every UPDATE.
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end$$ language plpgsql;

create trigger trg_set_updated_at_lideres  before update on lideres  for each row execute function set_updated_at();
create trigger trg_set_updated_at_paquetes before update on paquetes for each row execute function set_updated_at();
create trigger trg_set_updated_at_clientes before update on clientes for each row execute function set_updated_at();

-- Audit log — every insert/update/delete on the three tables is mirrored
-- into historial along with the acting user's email (from auth.users).
-- security definer so the trigger can write even though authenticated only
-- has SELECT on historial.
create or replace function audit_row(p_tabla text) returns trigger as $$
declare
  v_actor_id    uuid := auth.uid();
  v_actor_email text;
  v_datos       jsonb;
  v_id          text;
  v_accion      text;
begin
  if v_actor_id is not null then
    select email into v_actor_email from auth.users where id = v_actor_id;
  end if;

  if tg_op = 'DELETE' then
    v_id     := (old).id;
    v_datos  := to_jsonb(old);
    v_accion := 'delete';
  else
    v_id     := (new).id;
    v_datos  := to_jsonb(new);
    v_accion := case tg_op when 'INSERT' then 'insert' else 'update' end;
  end if;

  insert into historial (tabla, registro_id, accion, actor_id, actor_email, datos)
    values (p_tabla, v_id, v_accion, v_actor_id, v_actor_email, v_datos);

  return case when tg_op = 'DELETE' then old else new end;
end$$ language plpgsql security definer;

create trigger trg_audit_lideres  after insert or update or delete on lideres  for each row execute function audit_row('lideres');
create trigger trg_audit_paquetes after insert or update or delete on paquetes for each row execute function audit_row('paquetes');
create trigger trg_audit_clientes after insert or update or delete on clientes for each row execute function audit_row('clientes');

-- Rolling 30-day retention.
create or replace function purge_historial_antiguo() returns integer as $$
declare
  deleted_count integer;
begin
  delete from historial where created_at < now() - interval '30 days';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end$$ language plpgsql;

-- Daily purge via pg_cron (enable the extension first if needed).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'purge_historial_diario',
      '0 3 * * *',
      $cmd$ select purge_historial_antiguo(); $cmd$
    );
  end if;
end$$;
