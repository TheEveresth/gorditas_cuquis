# Esquema de la base

Proyecto de Supabase **`fkzargiqommrbagqnemm`**, Postgres 17, esquema `public`. Todas las tablas
tienen RLS prendido. `NN` = no acepta nulos. Tomado de `information_schema` el **2026-11-14**.

Este archivo es la referencia: **no se consulta la base para saber qué columnas hay.** Si al
trabajar se descubre que cambió, se actualiza aquí y se avisa.

## En uso por el POS

### `ordenes` — una cuenta
```
id uuid NN, mesa_id uuid, cliente_id uuid, empleado_id uuid,
tipo text NN, estado text NN, estado_preparacion text,
fecha_programada timestamptz, subtotal numeric, descuento numeric, total numeric,
created_at timestamptz, closed_at timestamptz,
referencia text, nombre_cliente text, telefono_cliente text, excepciones text, notas text
```
- Las tres columnas son `text` con un `check`, no enums. Lo que el `check` permite y lo que el
  POS usa de verdad no es lo mismo; comprobado el 2026-11-21 con `pg_get_constraintdef`:
- `tipo`: el `check` permite `local` | `para_llevar` | `domicilio` | `programado`. El POS solo
  escribe los dos primeros; los otros dos quedaron del diseño del Excel y no tienen pantalla.
- `estado`: el `check` permite `abierta` | `cerrada` | `cancelada`. `cobrar_items` la cierra
  cuando no queda nada pendiente. **Nada cancela una orden todavía.**
- `estado_preparacion`: el `check` permite `pendiente` | `en_produccion` | `listo` |
  `entregado`, y el default es `pendiente`. Una orden de mesa nace `pendiente` y una para
  llevar `en_produccion`; `pedidos.html` pinta las dos juntas en "Por preparar" y `listo`
  aparte. `listo` lo pone el botón "Marcar lista" de cocina, y **`entregado` lo pone la RPC
  `cobrar_items`** al cerrar la cuenta (comprobado el 2026-11-21 cobrando una orden de prueba).
  Nadie lo escribe desde el navegador.
- `mesa_id` es nulo en los pedidos para llevar.

### `orden_paquetes` — agrupación de renglones dentro de una cuenta
```
id uuid NN, orden_id uuid NN, nombre text NN, created_at timestamptz
```

### `orden_items` — un renglón cobrable
```
id uuid NN, orden_id uuid NN, paquete_id uuid, producto_id uuid,
cantidad numeric NN, precio_unitario numeric NN, total numeric,
nombre_personalizado text, notas text, pagado boolean
```
- `producto_id` es nulo en un "producto rápido": ahí el nombre va en `nombre_personalizado`.
- `pagado` es lo que permite el **cobro parcial**: se cobran renglones, no cuentas.
- `total` lo trae la tabla, pero el monto que se cobra lo recalcula `cobrar_items` con
  `cantidad * precio_unitario`.

### `pagos_venta` — un cobro
```
id uuid NN, orden_id uuid NN, metodo_pago text NN, monto numeric NN,
cobrado_por uuid, fecha timestamptz
```
- `metodo_pago`: `efectivo` | `tarjeta` | `transferencia`.
- `cobrado_por` → `empleados.id` (llave foránea: un id inventado revienta el insert).
- **No guarda lo recibido ni el cambio.** Se calculan y se muestran, nada más.
- Los pagos **anteriores al 2026-11-14** traen el monto inflado (se guardaba lo recibido en
  efectivo). Cualquier reporte filtra por fecha. Ver `MEMORY.md`.

### `productos`, `categorias`, `mesas`
```
productos:  id uuid NN, categoria_id uuid, nombre text NN,
            precio_venta numeric NN, precio_empleado numeric NN, activo boolean, created_at
categorias: id uuid NN, nombre text NN, activa boolean
mesas:      id uuid NN, numero integer NN, nombre text, activa boolean
```
`productos` no tiene política de `insert`: no hay pantalla de administración.

### `empleados` — **no legible desde el navegador**
```
id uuid NN, rol_sistema_id uuid, numero_empleado text NN, nombre text NN, telefono text,
password_hash text NN, sueldo_semanal numeric NN, activo boolean NN, created_at timestamptz
```
`anon` no tiene `select` aquí, a propósito: la tabla guarda el hash y el sueldo. El único acceso
es la RPC `login_empleado`, que devuelve cinco columnas y nunca el hash ni el sueldo.

## Funciones (RPC)

| Función | Qué hace |
|---|---|
| `login_empleado(p_numero text, p_password text)` | Verifica la contraseña con `extensions.crypt` (bcrypt) y devuelve `id, numero_empleado, nombre, telefono, rol_sistema_id`. `security definer`, ejecutable por `anon`. |
| `cobrar_items(p_orden_id uuid, p_item_ids uuid[], p_metodo text, p_empleado_id uuid)` | En una transacción: bloquea los renglones, suma `cantidad * precio_unitario` de los **no pagados** seleccionados, inserta en `pagos_venta`, marca `pagado`, y si no queda pendiente cierra la orden. Devuelve `jsonb` con `total_cobrado`, `items_cobrados`, `pendientes`, `cerrada`. Falla si la selección está vacía o ya estaba cobrada. |

Las dos son `security definer` con `search_path` fijo, `revoke all from public` y
`grant execute to anon`.

## Tablas que existen y nadie usa

RLS prendido, **cero políticas**, cero filas, sin pantalla. No están rotas: son módulos sin
estrenar. Al darles pantalla hacen falta política **y** `GRANT`.

| Módulo | Tablas |
|---|---|
| Nómina | `periodos_nomina`, `nomina_empleado`, `empleado_puestos`, `puestos`, `incentivos_empleado`, `multas_empleado`, `prestamos_empleado` |
| Inventario | `insumos`, `recetas`, `movimientos_inventario`, `proveedores` |
| Gastos | `gastos`, `pagos_gasto` |
| Otros | `clientes`, `consumos_empleado`, `roles_sistema` |

## Permisos: cómo se revisan

```sql
select tablename, policyname, cmd, roles from pg_policies
 where schemaname='public' and tablename='<tabla>';
select grantee, privilege_type from information_schema.role_table_grants
 where table_schema='public' and table_name='<tabla>' and grantee='anon';
```

Hacen falta **los dos**. Una política sin `GRANT` da
`42501 permission denied for table <tabla>`. Detalle: skill `supabase-cuquis`.
