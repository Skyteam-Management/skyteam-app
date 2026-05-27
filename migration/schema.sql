create table if not exists lideres (
  id          text primary key,
  nombre      text not null,
  apellido    text not null,
  created_at  timestamptz not null default now()
);

create table if not exists clientes (
  id            text primary key,
  nombre        text not null,
  telefono      text,
  lider         text references lideres(id) on delete set null,
  paquete       text,
  fecha_inicio  text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_clientes_lider on clientes(lider);

alter table lideres  enable row level security;
alter table clientes enable row level security;

create policy "authenticated full access on lideres"
  on lideres for all
  to authenticated
  using (true) with check (true);

create policy "authenticated full access on clientes"
  on clientes for all
  to authenticated
  using (true) with check (true);
