-- EJECUCION MANUAL. Un agente no ejecuta este script.
-- Plan:      013_PrecioGordita     Paso: 2
-- Proposito: politicas y GRANT de las tres tablas nuevas, para que el navegador pueda usarlas.
-- Requiere:  01_ddl_modificadores.sql
-- Rollback:  99_rollback_modificadores.sql
-- Verificar: la consulta del final; cada tabla con su politica Y su GRANT.

-- Las dos cosas hacen falta. Una politica sin GRANT da `42501 permission denied for table X`
-- (paso con orden_items el 2026-11-14). Ver la skill supabase-cuquis.

-- --- Catalogo: SOLO lectura, igual que productos y categorias. -----------------------
-- Dar de alta un guiso desde el navegador es la pantalla de administracion, con su
-- propio script. Mientras no exista, el catalogo se siembra con un script.

drop policy if exists "select modificador grupos" on public.modificador_grupos;
create policy "select modificador grupos" on public.modificador_grupos
  for select to anon using (true);
grant select on public.modificador_grupos to anon;

drop policy if exists "select modificadores" on public.modificadores;
create policy "select modificadores" on public.modificadores
  for select to anon using (true);
grant select on public.modificadores to anon;

-- --- Renglones de la cuenta: CRUD, igual que orden_items. ---------------------------
-- `delete` hace falta porque en tomar-orden se quita un renglon del carrito.

drop policy if exists "select orden item modificadores" on public.orden_item_modificadores;
create policy "select orden item modificadores" on public.orden_item_modificadores
  for select to anon using (true);

drop policy if exists "insert orden item modificadores" on public.orden_item_modificadores;
create policy "insert orden item modificadores" on public.orden_item_modificadores
  for insert to anon with check (true);

drop policy if exists "update orden item modificadores" on public.orden_item_modificadores;
create policy "update orden item modificadores" on public.orden_item_modificadores
  for update to anon using (true) with check (true);

drop policy if exists "delete orden item modificadores" on public.orden_item_modificadores;
create policy "delete orden item modificadores" on public.orden_item_modificadores
  for delete to anon using (true);

grant select, insert, update, delete on public.orden_item_modificadores to anon;

-- Verificacion (solo lectura): politicas por tabla
select tablename, policyname, cmd, roles::text
from pg_policies
where schemaname = 'public'
  and tablename in ('modificador_grupos', 'modificadores', 'orden_item_modificadores')
order by tablename, cmd;

-- Verificacion 2: GRANT de anon. Debe dar SELECT en las dos de catalogo y los cuatro
-- privilegios en orden_item_modificadores. Si falta aqui, la politica no sirve.
select table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and grantee = 'anon'
  and table_name in ('modificador_grupos', 'modificadores', 'orden_item_modificadores')
order by table_name, privilege_type;
