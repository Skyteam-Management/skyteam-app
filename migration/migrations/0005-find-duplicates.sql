-- 0005 — detection only (no writes). Run this first to preview what 0006 will merge/delete.
-- All queries are read-only. You can run them multiple times safely.

-- ============================================================
-- LIDERES — duplicates by (nombre, apellido)
-- ============================================================
-- Shows each duplicate group with the rows that would survive (oldest by created_at)
-- and the ones that 0006 will repoint+delete.
select
  nombre,
  apellido,
  count(*)                                                                  as veces,
  min(created_at)                                                           as conservado_created_at,
  array_agg(id order by created_at)                                         as ids_en_orden,
  (array_agg(id order by created_at))[1]                                    as id_conservado,
  (array_agg(id order by created_at))[2:]                                   as ids_a_eliminar
from lideres
group by nombre, apellido
having count(*) > 1
order by veces desc, nombre;

-- How many clientes hang off duplicate lider IDs that would be repointed.
with dups as (
  select id, nombre, apellido, created_at,
         row_number() over (partition by nombre, apellido order by created_at) as rn
  from lideres
)
select
  c.lider                                       as lider_id_actual,
  d_keep.id                                     as lider_id_destino,
  d_keep.nombre || ' ' || d_keep.apellido       as patrocinador,
  count(*)                                      as clientes_a_repuntar
from clientes c
join dups d_drop on d_drop.id = c.lider and d_drop.rn > 1
join dups d_keep on d_keep.nombre = d_drop.nombre
                and d_keep.apellido = d_drop.apellido
                and d_keep.rn = 1
group by c.lider, d_keep.id, d_keep.nombre, d_keep.apellido
order by clientes_a_repuntar desc;

-- ============================================================
-- CLIENTES — duplicates by (nombre, telefono, lider, fecha_inicio)
-- "Same person, same phone, same patrocinador, same payment date"
-- ============================================================
select
  nombre,
  telefono,
  lider,
  fecha_inicio,
  count(*)                                            as veces,
  min(created_at)                                     as conservado_created_at,
  array_agg(id order by created_at)                   as ids_en_orden,
  (array_agg(id order by created_at))[1]              as id_conservado,
  (array_agg(id order by created_at))[2:]             as ids_a_eliminar
from clientes
group by nombre, telefono, lider, fecha_inicio
having count(*) > 1
order by veces desc, nombre;

-- ============================================================
-- Sanity counts
-- ============================================================
select
  (select count(*) from lideres)  as total_lideres,
  (select count(*) from clientes) as total_clientes,
  (select count(*) from (
     select 1 from lideres group by nombre, apellido having count(*) > 1
   ) x) as lideres_grupos_duplicados,
  (select count(*) from (
     select 1 from clientes group by nombre, telefono, lider, fecha_inicio having count(*) > 1
   ) x) as clientes_grupos_duplicados;
