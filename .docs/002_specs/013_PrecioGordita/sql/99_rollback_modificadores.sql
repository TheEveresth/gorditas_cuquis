-- EJECUCION MANUAL. Un agente no ejecuta este script.
-- Plan:      013_PrecioGordita     Paso: rollback
-- Proposito: deshacer los scripts 01, 02 y 03: borra las tres tablas y la columna nueva.
-- Requiere:  01_ddl_modificadores.sql
-- Rollback:  irreversible: respaldo previo
-- Verificar: la consulta del final no debe devolver ninguna fila.

-- NO SE CORRE A LA LIGERA. Se lleva datos:
--   * `orden_item_modificadores` es el detalle de lo que llevo cada renglon ya cobrado.
--     Perderlo deja las cuentas viejas sin decir de que era la gordita. El monto cobrado
--     NO se pierde: eso vive en orden_items.precio_unitario y en pagos_venta.
--   * `productos.grupos_modificadores` se lleva que productos aceptan modificadores.
--   * el catalogo de guisos con su comision.
-- Antes de correrlo: respaldo de las tres tablas y de la columna. La consulta de abajo
-- dice cuanto se va a perder.

-- Cuanto hay antes de borrar (solo lectura). Si no es 0 y no hay respaldo, DETENERSE.
select
  (select count(*) from public.orden_item_modificadores) as renglones_con_modificador,
  (select count(*) from public.modificadores)            as modificadores,
  (select count(*) from public.modificador_grupos)       as grupos,
  (select count(*) from public.productos
     where grupos_modificadores is not null)             as productos_con_grupos;

-- Orden inverso al de creacion: primero lo que referencia, luego lo referenciado.
drop table if exists public.orden_item_modificadores;
drop table if exists public.modificadores;
drop table if exists public.modificador_grupos;

alter table public.productos
  drop column if exists grupos_modificadores;

-- Verificacion (solo lectura): sin filas = todo deshecho
select c.relname
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('modificador_grupos', 'modificadores', 'orden_item_modificadores');

select column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'productos'
  and column_name = 'grupos_modificadores';
