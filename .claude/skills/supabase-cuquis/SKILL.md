---
name: supabase-cuquis
description: >
  Cómo trabajar la base de Supabase del POS Gorditas Cuquis: el agente solo
  lee, los cambios de esquema o de datos se entregan como script SQL en
  `.docs/002_specs/<plan>/sql/` y los ejecuta una persona. Incluye el formato
  de los scripts (encabezado, orden, idempotencia, rollback), la regla de que
  una política RLS no sirve sin su GRANT, el patrón de RPC con SECURITY
  DEFINER y las trampas ya conocidas de este proyecto. Usar al consultar la
  base, al escribir SQL, al tocar políticas, permisos o funciones, y cuando se
  hable de "migración", "DDL", "RLS", "política", "GRANT", "RPC", "esquema",
  "permiso denegado" o "seed".
---

# Skill: base de datos del POS Gorditas Cuquis

Proyecto de Supabase: **`fkzargiqommrbagqnemm`**. Postgres 17 + PostgREST, cliente
`supabase-js` v2 desde el CDN, llave `publishable` (rol `anon`).
Esquema y tablas: `.docs/001_arquitectura/esquema-bd.md`.

Del lado del navegador, los datos de conexión están **solo** en `js/core/conexion.js` y todas
las consultas **solo** en `js/core/datos.js`; las pantallas no tocan `db`. Eso es orden, no
seguridad: la llave es pública y quien la tenga puede llamar a la base por su cuenta. Lo que
de verdad protege los datos es lo que sigue en este archivo.

## Regla de oro

El agente **lee** y **escribe scripts**; **no ejecuta** nada que cambie la base. Lo ejecuta el
usuario. Vale para DDL, DML, políticas, permisos, funciones y `apply_migration`.

Permitido: `SELECT`, `EXPLAIN`, `information_schema`, `pg_catalog`, los *advisors* de Supabase y
los logs.

Prohibido: `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `CREATE`, `ALTER`, `DROP`, `GRANT`,
`REVOKE`, `create policy`, `create function`, `apply_migration`, y llamar una RPC que escriba
(`cobrar_items`, `login_empleado` cuenta como lectura pero toca credenciales: no se usa para
probar contraseñas de nadie).

Tampoco se escribe **de forma indirecta**: no se usa la app ni el navegador para dar de alta
datos de prueba, ni un harness que inserte.

**Única excepción:** el usuario autoriza por escrito ese cambio concreto en el chat. Vale para
ese cambio, no para los que siguen. Lo que se corrió se anota en el `05_avance.md` del plan (o
se propone para `MEMORY.md` si no hay plan).

Y hay una razón práctica, no solo de proceso: **desarrollo y producción comparten esta base.**
Un `INSERT` de prueba queda en producción.

---

## Los scripts SQL

Van en `.docs/002_specs/<NNN>_<Nombre>/sql/`. Fuera de un plan, se le entregan al usuario en el
chat o en un archivo que él decida, nunca sueltos en la raíz.

### Nombre y orden

- `NN_<tipo>_<desc>.sql`, con `NN` de dos dígitos que **es** el orden de ejecución.
  `tipo`: `ddl`, `rls` (políticas y permisos), `fn` (funciones/RPC), `seed`, `data`, `idx`.
- Un script por cambio lógico. No mezclar esquema y datos.
- Rollback: `99_rollback_<desc>.sql`, que deshace en orden inverso. Si algo no se puede
  deshacer, el encabezado lo dice y exige respaldo previo.

### Encabezado obligatorio

```sql
-- EJECUCION MANUAL. Un agente no ejecuta este script.
-- Plan:      <NNN_Nombre>          Paso: <n>
-- Proposito: <una linea>
-- Requiere:  <scripts previos NN, o "ninguno">
-- Rollback:  99_rollback_<desc>.sql   (o "irreversible: respaldo previo")
-- Verificar: <consulta de solo lectura que prueba que quedo bien>
```

### Idempotencia y seguridad

- Todo script corre dos veces sin error: `if not exists`, `create or replace`,
  `drop policy if exists` antes de `create policy`.
- Todo `update`/`delete` lleva `where` explícito y, antes, una consulta que cuenta las filas
  que va a tocar. Si el número no es el esperado, se detiene.
- Lo aditivo primero (columna nueva nula o con default); lo destructivo, en otro script
  posterior.
- Sin `drop` ni `truncate` sin respaldo y sin mención en el plan aprobado.
- No se versionan datos reales ni credenciales.

---

## Reglas de esta base

### 1. Una política RLS no sirve sin su GRANT

Son dos permisos distintos y los dos hacen falta. `create policy ... for delete to anon` no
alcanza si el rol `anon` no tiene `grant delete` en la tabla: PostgREST responde
`42501 permission denied for table X`. Pasó con `orden_items` el 2026-11-14.

Al abrir una operación nueva, el script lleva las dos cosas:

```sql
drop policy if exists "delete orden items" on public.orden_items;
create policy "delete orden items" on public.orden_items for delete to anon using (true);
grant delete on public.orden_items to anon;
```

Y al revisar un "permiso denegado", revisar **las dos**:

```sql
select tablename, cmd, roles from pg_policies where schemaname='public' and tablename='<tabla>';
select grantee, privilege_type from information_schema.role_table_grants
 where table_schema='public' and table_name='<tabla>' and grantee='anon';
```

### 2. Lo que no debe verse desde el navegador va en una RPC

La llave `publishable` viaja al cliente: cualquier tabla legible por `anon` es pública. Los
datos sensibles no llevan política de `select`; se exponen con una función
`security definer` que devuelve **solo** las columnas necesarias:

```sql
create or replace function public.login_empleado(p_numero text, p_password text)
returns table (id uuid, numero_empleado text, nombre text, telefono text, rol_sistema_id uuid)
language sql security definer set search_path = public, extensions as $$
  select e.id, e.numero_empleado, e.nombre, e.telefono, e.rol_sistema_id
  from public.empleados e
  where e.numero_empleado = p_numero and e.activo = true
    and e.password_hash = extensions.crypt(p_password, e.password_hash);
$$;
revoke all on function public.login_empleado(text, text) from public;
grant execute on function public.login_empleado(text, text) to anon;
```

Toda función nueva: `security definer` + `set search_path` fijo + `revoke all from public` +
`grant execute to anon`. Sin el `search_path` la función es un hueco de seguridad.

### 3. Lo que debe pasar completo o no pasar va en una sola RPC

El cobro es el ejemplo: `cobrar_items(p_orden_id, p_item_ids, p_metodo, p_empleado_id)` registra
el pago, marca los renglones y cierra la cuenta en **una** transacción, y **calcula el monto
ella misma** a partir de los renglones. El navegador no manda importes: mandaba lo recibido en
efectivo y se guardaba eso como cobrado.

Si la operación tiene dos pasos y el segundo puede fallar, va en una función, no en dos
llamadas desde el JavaScript.

### 4. Trampas conocidas

- `for update` **no** se puede combinar con funciones de agregado. Primero se bloquea
  (`perform 1 from ... where ... for update`) y luego, en otra sentencia, se agrega.
- `pgcrypto` está instalada en el esquema **`extensions`**: es `extensions.crypt()` y
  `extensions.gen_salt('bf', 10)`, no `crypt()` pelón.
- 16 tablas tienen RLS prendido y **cero** políticas (nómina, inventario, gastos, clientes,
  proveedores…). No están "rotas": son módulos sin estrenar. Al darles pantalla, política + grant.
- `rls_auto_enable()` es `security definer` y `anon` puede ejecutarla. Lo marca el linter de
  Supabase y sigue pendiente.
- Los pagos anteriores al 2026-11-14 traen el monto inflado (ver `MEMORY.md`). Cualquier reporte
  de `pagos_venta` filtra por fecha.

---

## Consultas de diagnóstico

```sql
-- Políticas y permisos de una tabla
select tablename, policyname, cmd, roles from pg_policies where schemaname='public';
-- Tablas con RLS y sin políticas
select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind='r' and c.relrowsecurity
   and not exists (select 1 from pg_policies p where p.tablename=c.relname);
-- Funciones expuestas
select p.proname, p.prosecdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public';
```

`n_live_tup` de `pg_stat_user_tables` es una **estimación** y aquí está desactualizada: para
contar filas, `count(*)`.

## No hacer

- Ejecutar SQL de escritura desde el agente, por pequeño que sea.
- Insertar datos de prueba sin avisar y sin acordar cómo se limpian.
- Abrir una tabla a `anon` "para que funcione rápido" cuando lo correcto es una RPC.
- Editar un script que el usuario ya ejecutó: se agrega otro con el siguiente `NN`.
- Documentar el esquema en dos lugares: vive en `.docs/001_arquitectura/esquema-bd.md`.
