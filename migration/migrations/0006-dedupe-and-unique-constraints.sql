-- 0006 — deduplicate lideres + clientes and add UNIQUE constraints.
-- Run 0005 first to preview which rows will be merged/deleted.
--
-- Rules:
--   lideres   : duplicate = same (nombre, apellido). Keep oldest by created_at;
--               repoint clientes.lider to the survivor, then delete the rest.
--   clientes  : duplicate = same (nombre, telefono, lider, fecha_inicio). Keep
--               oldest by created_at; delete the rest.
--
-- NULLS NOT DISTINCT (PG15+) means two NULLs in the unique key compare as equal
-- — so "Juan Pérez, sin teléfono, sin patrocinador, sin fecha" is unique once.
--
-- Idempotent. Wrapped in a transaction so a failure leaves the DB untouched.

begin;

-- ============================================================
-- 1. LIDERES: pick survivor, repoint clientes, delete losers
-- ============================================================
with ranked as (
  select id, nombre, apellido,
         row_number() over (partition by nombre, apellido order by created_at, id) as rn,
         first_value(id) over (partition by nombre, apellido order by created_at, id) as keep_id
  from lideres
)
update clientes c
   set lider = r.keep_id
  from ranked r
 where r.id = c.lider
   and r.rn > 1;

delete from lideres l
 using (
   select id
     from (
       select id,
              row_number() over (partition by nombre, apellido order by created_at, id) as rn
         from lideres
     ) x
    where rn > 1
 ) d
 where l.id = d.id;

-- ============================================================
-- 2. CLIENTES: keep oldest per (nombre, telefono, lider, fecha_inicio); delete the rest
-- ============================================================
delete from clientes c
 using (
   select id
     from (
       select id,
              row_number() over (
                partition by nombre, telefono, lider, fecha_inicio
                order by created_at, id
              ) as rn
         from clientes
     ) x
    where rn > 1
 ) d
 where c.id = d.id;

-- ============================================================
-- 3. UNIQUE constraints — prevent future duplicates
-- ============================================================
alter table lideres  drop constraint if exists lideres_nombre_apellido_key;
alter table clientes drop constraint if exists clientes_unique_business_key;

alter table lideres
  add constraint lideres_nombre_apellido_key
  unique (nombre, apellido);

alter table clientes
  add constraint clientes_unique_business_key
  unique nulls not distinct (nombre, telefono, lider, fecha_inicio);

commit;
