-- 0002 — paquetes table + clientes view + fecha_inicio→date
-- Non-destructive. Idempotent. Safe to re-run.
-- Run from Supabase SQL editor or psql against an existing DB.

begin;

-- 1. paquetes catalog
create table if not exists paquetes (
  id          text primary key,
  nombre      text not null unique,
  dias        integer not null check (dias > 0),
  activo      boolean not null default true,
  orden       integer,
  created_at  timestamptz not null default now()
);

-- 2. Seed with the IDs the app has been writing all along
-- (matches the old PAQUETES constant, with durations from the old
--  getPaqueteDuration switch). on conflict do nothing keeps re-runs safe.
insert into paquetes (id, nombre, dias, orden) values
  ('13', '8 DÍAS',     8,   1),
  ('14', '15 DÍAS',    15,  2),
  ('5',  '1 MES',      31,  3),
  ('12', '2 MESES',    60,  4),
  ('4',  '3 MESES',    91,  5),
  ('11', '4 MESES',    121, 6),
  ('10', '5 MESES',    151, 7),
  ('3',  '6 MESES',    182, 8),
  ('9',  '7 MESES',    212, 9),
  ('8',  '8 MESES',    243, 10),
  ('2',  '9 MESES',    273, 11),
  ('7',  '10 MESES',   304, 12),
  ('6',  '11 MESES',   334, 13),
  ('1',  '12 MESES',   365, 14)
on conflict (id) do nothing;

-- 3. RLS — same shape as lideres/clientes
alter table paquetes enable row level security;

drop policy if exists "authenticated full access on paquetes" on paquetes;
create policy "authenticated full access on paquetes"
  on paquetes for all
  to authenticated
  using (true) with check (true);

-- 4. Null-out any orphaned clientes.paquete refs BEFORE adding the FK.
--    This does not delete rows; only clears a dangling reference so the
--    FK constraint can be added. If you want to audit them first, run:
--      select id, nombre, paquete from clientes
--      where paquete is not null and paquete not in (select id from paquetes);
update clientes
  set paquete = null
  where paquete is not null
    and paquete not in (select id from paquetes);

alter table clientes drop constraint if exists clientes_paquete_fk;
alter table clientes
  add constraint clientes_paquete_fk
  foreign key (paquete) references paquetes(id) on delete set null;

-- 5. Convert fecha_inicio from text to date.
--    The app has only ever written ISO date strings ('YYYY-MM-DD' from
--    <input type="date"> or full ISO from Date.toISOString()), both cast
--    cleanly. Empty strings/null become null.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'clientes' and column_name = 'fecha_inicio' and data_type = 'text'
  ) then
    execute $cast$
      alter table clientes
        alter column fecha_inicio type date
        using case
          when fecha_inicio is null or trim(fecha_inicio) = '' then null
          else fecha_inicio::date
        end
    $cast$;
  end if;
end$$;

-- 6. Enriched view — single source of truth for paquete name,
--    fecha_vencimiento and expirado. The app reads from this.
--    Writes still go to the clientes table directly.
create or replace view clientes_view as
select
  c.id,
  c.nombre,
  c.telefono,
  c.lider,
  c.paquete,
  c.fecha_inicio,
  c.created_at,
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

-- Run with the caller's permissions (so RLS on clientes/lideres/paquetes
-- applies to the view too). Requires Postgres 15+, which Supabase uses.
alter view clientes_view set (security_invoker = true);

commit;
