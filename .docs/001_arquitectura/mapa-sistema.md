# Mapa del sistema

POS web de Gorditas Cuquis. Sitio estático (HTML + CSS + JS plano, sin build) servido como
archivos, que habla directo con **Supabase** desde el navegador con la llave `publishable`
(rol `anon`). No hay servidor propio ni API intermedia: lo que el navegador no pueda hacer con
esa llave, se resuelve con una función de la base (RPC).

```
Navegador                         Supabase (fkzargiqommrbagqnemm)
┌──────────────────────┐          ┌────────────────────────────────┐
│ <pagina>.html        │          │ PostgREST  ── RLS + GRANT      │
│ css/01..03           │  HTTPS   │   tablas: ordenes, items, ...  │
│ js/core/config.js ───┼─────────▶│                                │
│ js/core/sesion.js    │   anon   │ RPC (security definer)         │
│ js/pantallas/*.js    │          │   login_empleado, cobrar_items │
└──────────────────────┘          └────────────────────────────────┘
```

## Flujo del negocio

```
                     ┌─ mesas → cuentas ──┐
login → dashboard ───┤                    ├─→ tomar-orden → (orden abierta)
                     └─ para-llevar ──────┘
                                                     │
                              pedidos (cocina) ◀─────┘
                                                     │
                                       pos (cobro) ◀──┴── cuentas / pedidos
                                                     │
                                            orden cerrada
```

1. **Entrar.** `index.html` pide número de empleado y contraseña. La contraseña se verifica con
   `bcrypt` **dentro de la base** (RPC `login_empleado`); el navegador no puede leer la tabla
   `empleados`. El empleado que vuelve queda en `localStorage`.
2. **Abrir cuenta.** De mesa (`mesas` → `cuentas`) o para llevar (`para-llevar`). Se crea un
   renglón en `ordenes` con `estado = 'abierta'` y `tipo = 'local' | 'para_llevar'`.
3. **Capturar.** `tomar-orden` agrega los productos. Los renglones se agrupan en **paquetes**
   (`orden_paquetes`): un paquete es lo que va junto para una persona o para una entrega.
4. **Cocina.** `pedidos` muestra la cola. **Hoy filtra solo `tipo = para_llevar`**: las órdenes
   de mesa no llegan ahí (está anotado como deuda).
5. **Cobrar.** `pos` permite cobrar **renglones sueltos**, no toda la cuenta: cada `orden_items`
   tiene su bandera `pagado`. Al cobrar se llama la RPC `cobrar_items`, que en **una
   transacción** registra el pago, marca los renglones y, si ya no queda nada pendiente, cierra
   la orden (`estado = 'cerrada'`, `closed_at`).

## Las pantallas

| Pantalla | Script | Qué hace | Tablas que toca |
|---|---|---|---|
| `index.html` | `js/pantallas/index.js` | login | RPC `login_empleado` |
| `dashboard.html` | `dashboard.js` | ventas del día, órdenes, mesas con cuenta abierta | `ordenes` |
| `mesas.html` | `mesas.js` | mapa de mesas con su total actual | `mesas`, `ordenes` |
| `cuentas.html` | `cuentas.js` | cuentas abiertas de una mesa | `ordenes`, `orden_items` |
| `tomar-orden.html` | `tomar-orden.js` | captura por paquetes | `productos`, `categorias`, `ordenes`, `orden_paquetes`, `orden_items` |
| `para-llevar.html` | `para-llevar.js` | alta de pedido para llevar | `ordenes` |
| `pedidos.html` | `pedidos.js` | cola de cocina | `ordenes`, `orden_items` |
| `pos.html` | `pos.js` | cobro parcial o total | todo lo anterior + RPC `cobrar_items` |

El archivo más grande es `js/pantallas/pos.js` (~800 líneas). Para ubicarse:
`grep -n "function " js/pantallas/pos.js`.

## Decisiones de arquitectura vigentes

- **Sin build ni npm.** Se abre el HTML y corre; se edita y se recarga. El costo es que no hay
  módulos: todo son scripts clásicos y variables globales compartidas por orden de carga.
- **El navegador no es de fiar.** La llave viaja al cliente, así que la base defiende sus datos
  con RLS + `GRANT`, y lo sensible o lo que debe ser atómico vive en una RPC
  `security definer`. Los montos a guardar los calcula la base.
- **Una sola base para desarrollo y producción.** No hay ambiente de pruebas: cualquier dato de
  prueba queda en producción.
- **El estado entre pantallas viaja en `localStorage`** (`empleado`, `mesa`, `ordenActual`), no
  en la URL.

## Qué falta

Sin pantalla todavía: corte de caja, gastos, nómina, inventario y administración de catálogos
(productos, mesas, empleados). Las tablas de esos módulos ya existen, vacías y sin políticas.
Ver `.docs/003_deuda/README.md`.

## De dónde viene

Antes del POS web el negocio operaba con un Excel con macros
(`InterfazDICIEMBRE.xlsm` y el rediseño `SistemaCuquis_Fase1.xlsm`, en
`OneDrive\Escritorio\Documentos\GORDITAS CUQUIS`). De ahí salen el catálogo real y las reglas de
precio que todavía no se han modelado aquí: ver `reglas-negocio.md`.
