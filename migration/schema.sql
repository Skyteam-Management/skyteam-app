-- Target schema for fresh installs.
-- For existing databases, apply migrations/0002-*.sql incrementally instead.

create table if not exists lideres (
  id          text primary key,
  nombre      text not null,
  apellido    text not null,
  created_at  timestamptz not null default now()
);

create table if not exists paquetes (
  id          text primary key,
  nombre      text not null unique,
  dias        integer not null check (dias > 0),
  activo      boolean not null default true,
  orden       integer,
  created_at  timestamptz not null default now()
);

create table if not exists clientes (
  id            text primary key,
  nombre        text not null,
  telefono      text,
  lider         text references lideres(id) on delete set null,
  paquete       text references paquetes(id) on delete set null,
  fecha_inicio  date,
  created_at    timestamptz not null default now()
);

create index if not exists idx_clientes_lider   on clientes(lider);
create index if not exists idx_clientes_paquete on clientes(paquete);

-- Default catalog
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

-- RLS
alter table lideres  enable row level security;
alter table paquetes enable row level security;
alter table clientes enable row level security;

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
