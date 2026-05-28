-- 0004 — normalize all name/text fields to upper case.
-- 1. Backfill existing rows.
-- 2. Add BEFORE INSERT/UPDATE triggers so any future write
--    (from the app, the Supabase dashboard, or a script) is upper-cased automatically.
-- Idempotent. Re-runnable.

begin;

-- 1. Backfill — only touches rows that aren't already upper.
update lideres
  set nombre = upper(nombre), apellido = upper(apellido)
  where nombre <> upper(nombre) or apellido <> upper(apellido);

update paquetes
  set nombre = upper(nombre)
  where nombre <> upper(nombre);

update clientes
  set nombre = upper(nombre)
  where nombre <> upper(nombre);

update clientes
  set telefono = upper(telefono)
  where telefono is not null and telefono <> upper(telefono);

-- 2. Trigger functions. One per table — keeps the function focused on the
--    columns that table actually has, so a future column addition surfaces
--    here as a deliberate edit instead of silently slipping through.

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

drop trigger if exists trg_uppercase_lideres  on lideres;
drop trigger if exists trg_uppercase_paquetes on paquetes;
drop trigger if exists trg_uppercase_clientes on clientes;

create trigger trg_uppercase_lideres
  before insert or update on lideres
  for each row execute function uppercase_lideres();

create trigger trg_uppercase_paquetes
  before insert or update on paquetes
  for each row execute function uppercase_paquetes();

create trigger trg_uppercase_clientes
  before insert or update on clientes
  for each row execute function uppercase_clientes();

commit;
