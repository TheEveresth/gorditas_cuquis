-- EJECUCION MANUAL. Un agente no ejecuta este script.
-- Plan:      013_PrecioGordita     Paso: 3
-- Proposito: sembrar los dos grupos de modificadores y las dos tortillas.
-- Requiere:  01_ddl_modificadores.sql, 02_rls_modificadores.sql
-- Rollback:  99_rollback_modificadores.sql (se lleva tambien estas filas)
-- Verificar: la consulta del final; 2 grupos y 2 modificadores de tortilla.

-- Esto es lo unico del catalogo que se puede sembrar sin el Excel: sale de
-- .docs/001_arquitectura/reglas-negocio.md. Los guisos van en 04_seed_catalogo.sql.
--
-- OJO con `maximo` del grupo `guiso`: queda en nulo (sin tope) porque las comisiones se
-- acumulan. Si el dueno dice en el paso 1 que la gordita lleva UN solo guiso, se corrige
-- aqui antes de correrlo, o con otro script si ya se corrio.

insert into public.modificador_grupos (clave, nombre, minimo, maximo, orden) values
  ('tortilla', 'Tortilla', 1, 1,    1),
  ('guiso',    'Guiso',    1, null, 2)
on conflict (clave) do nothing;

-- maiz no suma nada: es la base de los $14. Se da de alta igual para que la eleccion sea
-- explicita y el ticket diga de que era la gordita.
insert into public.modificadores (grupo, nombre, precio_delta, activo) values
  ('tortilla', 'Maíz',   0, true),
  ('tortilla', 'Harina', 1, true)
on conflict (grupo, nombre) do nothing;

-- Verificacion (solo lectura)
select clave, nombre, minimo, maximo from public.modificador_grupos order by orden;

select grupo, nombre, precio_delta, activo
from public.modificadores
order by grupo, nombre;
