# 013 — Avance

| Fecha | Qué se hizo |
|---|---|
| 2026-11-21 | Plan escrito. Elegido el modelo de producto base + modificadores con precio propio. Escritos `01_ddl_modificadores.sql`, `02_rls_modificadores.sql`, `03_seed_grupos_y_tortilla.sql` y el rollback. **Sin ejecutar.** |

## Decisiones

- 2026-11-21 — **Las excepciones no llevan tabla.** Cada guiso trae su propio `precio_delta`, así
  que un guiso exceptuado es un `0`. La deuda 002 pedía una tabla de excepciones; se cierra de
  otra forma, más simple.
- 2026-11-21 — **`orden_items.precio_unitario` sigue guardando el precio final del renglón**, ya
  con los modificadores sumados, y `cobrar_items` no se toca. Por qué: el cobro se probó de punta
  a punta el 2026-11-21 y no hay razón para volver a ponerlo en riesgo. El modificador es
  detalle, no dinero aparte.
- 2026-11-21 — El precio y el nombre del modificador se **copian** al renglón de la cuenta. Por
  qué: si el queso sube de precio, las cuentas de ayer no pueden cambiar.
- 2026-11-21 — El descuento al personal (−$2) queda fuera del plan. El modelo lo soporta sin
  cambios (un modificador con `precio_delta` negativo), pero quién lo autoriza es el módulo
  `consumos_empleado`.

## Pendiente de resolver

- Las tres preguntas del paso 1, que el dueño tiene que contestar: cuántos guisos por gordita,
  si la harina cuesta +$1 en todo, y si algo que no es gordita lleva modificadores.
- El export de las hojas `CATALOGO`, `GUISOS` y `EXCEPCIONES` del Excel. **Es lo único que
  bloquea el paso 4**, y sin el paso 4 el plan no cierra.

## Estado BD

**Nada ejecutado todavía.** Comprobado el 2026-11-21: `public.modificadores` no existe,
`productos` no tiene la columna `grupos_modificadores`, y las políticas de `productos` y
`categorias` siguen siendo solo de `select` para `anon`.
