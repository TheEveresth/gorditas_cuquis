-- EJECUCION MANUAL. Un agente no ejecuta este script.
-- Plan:      013_PrecioGordita     Paso: 2
-- Proposito: crear las tres tablas de modificadores y la columna que dice que grupos acepta un producto.
-- Requiere:  ninguno
-- Rollback:  99_rollback_modificadores.sql
-- Verificar: la consulta del final; tres tablas y la columna nueva.

-- OJO: las tablas nacen con RLS prendido, porque el disparador de eventos `ensure_rls` lo
-- hace solo. Sin politica y sin GRANT no se pueden ni leer: corre 02_rls_modificadores.sql
-- en la misma sesion o la pantalla responde 42501.

-- Grupos de modificadores. `minimo` y `maximo` son lo que la pantalla de captura obedece:
-- la tortilla es exactamente una, el guiso al menos uno. `maximo` nulo = sin tope.
create table if not exists public.modificador_grupos (
  clave   text primary key,
  nombre  text not null,
  minimo  integer not null default 0,
  maximo  integer,
  orden   integer not null default 0
);

-- Un modificador por tortilla y uno por guiso. `precio_delta` es lo que SUMA al precio base:
-- 0 en un guiso exceptuado, 2 en la comision normal, 4 si acumula dos.
-- Admite negativos a proposito (el descuento al personal, que todavia no tiene pantalla).
create table if not exists public.modificadores (
  id            uuid primary key default gen_random_uuid(),
  grupo         text not null references public.modificador_grupos (clave),
  nombre        text not null,
  precio_delta  numeric not null default 0,
  activo        boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (grupo, nombre)
);

create index if not exists modificadores_grupo_idx
  on public.modificadores (grupo) where activo;

-- Que grupos acepta un producto: '{tortilla,guiso}' en la gordita, nulo en un refresco.
-- Columna aditiva y nula: no rompe ninguna consulta de hoy.
alter table public.productos
  add column if not exists grupos_modificadores text[];

-- Lo que llevo ESE renglon de la cuenta. `nombre` y `precio_delta` se COPIAN del catalogo:
-- si manana el queso sube de precio, las cuentas de ayer no cambian. Mismo criterio que
-- `orden_items.precio_unitario`.
-- `modificador_id` queda nulable para no atar el historico a que el catalogo no cambie.
create table if not exists public.orden_item_modificadores (
  id              uuid primary key default gen_random_uuid(),
  orden_item_id   uuid not null references public.orden_items (id) on delete cascade,
  modificador_id  uuid references public.modificadores (id),
  nombre          text not null,
  precio_delta    numeric not null,
  created_at      timestamptz not null default now()
);

create index if not exists orden_item_modificadores_item_idx
  on public.orden_item_modificadores (orden_item_id);

-- Verificacion (solo lectura): las tres tablas, con RLS prendido y todavia sin politicas
select c.relname, c.relrowsecurity as rls,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = c.relname) as politicas
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('modificador_grupos', 'modificadores', 'orden_item_modificadores')
order by c.relname;

-- Verificacion 2: la columna nueva
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'productos'
  and column_name = 'grupos_modificadores';
