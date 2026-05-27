-- 0003 — drop unused paquetes.orden column.
-- Safe: no app code reads or writes it; clientes_view does not reference it. Re-runnable.

alter table paquetes drop column if exists orden;
