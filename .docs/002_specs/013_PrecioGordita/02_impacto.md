# 013 — Impacto

## El modelo que se eligió

**Producto base + modificadores, cada modificador con su propio precio.**

Tres tablas nuevas y una columna:

| Tabla | Para qué |
|---|---|
| `modificador_grupos` | `tortilla`, `guiso`. Cada grupo dice cuántos se pueden elegir (`minimo`, `maximo`) |
| `modificadores` | `maíz` +$0, `harina` +$1, y un renglón por guiso con su `precio_delta` |
| `orden_item_modificadores` | lo que ese renglón de la cuenta llevó, con el precio **copiado** |
| `productos.grupos_modificadores` | `{tortilla,guiso}` en la gordita; nulo en un refresco |

Tres decisiones que vale la pena dejar escritas:

1. **Las excepciones no necesitan tabla.** La deuda 002 pedía "una tabla de excepciones", pero si
   cada guiso trae su propio `precio_delta`, un guiso exceptuado es simplemente `0`. Una columna
   en lugar de una regla con casos especiales.
2. **Las comisiones se acumulan porque el renglón acepta varios modificadores**, y el precio es
   la suma. No hay lógica de "la mayor" que programar ni evitar.
3. **El precio se copia al cobrar, no se referencia.** `orden_item_modificadores` guarda `nombre`
   y `precio_delta` tal como estaban, igual que `orden_items.precio_unitario`. Si mañana el queso
   sube a $3, las cuentas de ayer no cambian.

### Lo que NO cambia, y es lo importante

`orden_items.precio_unitario` sigue guardando el **precio final del renglón**, ya con los
modificadores sumados. Por eso:

- **`cobrar_items` no se toca.** Sigue sumando `cantidad * precio_unitario` y la base sigue
  calculando el monto. El cobro, que se probó de punta a punta el 2026-11-21, no se vuelve a
  poner en riesgo.
- `pagos_venta`, el cierre de la cuenta y el cobro parcial siguen igual.
- El dashboard y el corte de caja futuro tampoco se enteran.

El modificador es **detalle**, no es dinero aparte.

### Alternativas que se descartaron

- **Un precio por combinación** (una fila por gordita × tortilla × guiso): 16 guisos × 2
  tortillas son 32 filas solo de gorditas, y cada guiso nuevo obliga a generarlas otra vez.
- **Calcularlo en el navegador** a partir de reglas en JavaScript: va contra la regla del
  proyecto de que el dinero lo calcula la base, y deja el precio en ocho archivos.
- **Una tabla de excepciones aparte**, como decía la deuda 002: ver el punto 1.

## Archivos que toca

| Archivo | Qué |
|---|---|
| `js/core/datos.js` | leer grupos y modificadores; guardar los del renglón |
| `js/pantallas/tomar-orden.js` | elegir tortilla y guisos, armar y mostrar el precio |
| `tomar-orden.html` | el selector de modificadores |
| `css/03-pantallas.css` | estilos de ese selector |
| `js/pantallas/pos.js` | mostrar en cada renglón lo que lleva |
| `js/pantallas/pedidos.js` | la comanda de cocina tiene que decir el guiso |
| `.docs/001_arquitectura/esquema-bd.md` | las tablas nuevas |
| `.docs/001_arquitectura/reglas-negocio.md` | las reglas pasan de "sigue en el Excel" a "ya está en el sistema" |

## Base de datos

Tablas nuevas: `modificador_grupos`, `modificadores`, `orden_item_modificadores`.
Columna nueva: `productos.grupos_modificadores text[]` (aditiva, nula, no rompe nada).

Las tres nacen con RLS prendido, porque el disparador `ensure_rls` lo hace solo (ver plan 009).
Eso significa que **sin política y sin `GRANT` no se pueden ni leer**: los scripts `01` y `02`
van juntos o la pantalla responde `42501`.

Permisos que se piden, copiando lo que ya tienen las tablas equivalentes:

- `modificador_grupos` y `modificadores`: **solo `select`** para `anon`, como `productos` y
  `categorias`. Dar de alta un guiso será la pantalla de administración, con su propio script.
- `orden_item_modificadores`: `select`, `insert`, `update`, `delete`, como `orden_items`.

Nada de esto necesita una RPC nueva: no hay dato sensible y no hay operación que deba ser
atómica. La que sí lo era, el cobro, ya existe.

## Deuda que roza

| Deuda | Qué le pasa |
|---|---|
| [002](../../003_deuda/002_ReglasPrecioGordita.md) — las reglas no se pueden representar | **se cierra** con este plan |
| [001](../../003_deuda/001_CatalogoNoCargado.md) — el catálogo no está cargado | se cierra en el paso 4, si llega el export del Excel |
| [004](../../003_deuda/004_TablasSinPoliticas.md) — tablas con RLS y sin políticas | no empeora: las tres tablas nuevas nacen con política y `GRANT` |
| [012](../../003_deuda/012_TotalCuentaIncluyeLoPagado.md) — "Total cuenta" suma lo pagado | sin relación, pero se toca `pos.js`: conviene arreglarla en el mismo paso 6 |

## Riesgo

Medio, y está concentrado en `tomar-orden.js` (498 líneas) y `pos.js` (713). El cobro no se
toca, así que lo peor que puede pasar es capturar mal un renglón, no cobrar mal una cuenta.
