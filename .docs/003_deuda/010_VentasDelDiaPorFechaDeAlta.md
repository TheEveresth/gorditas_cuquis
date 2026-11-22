# 010 — Las ventas del día se cuentan por fecha de alta, no de cobro

**Riesgo:** alto · **Estado:** cerrada el 2026-11-21 · Detectada el mismo día (probando el cobro)

`js/core/datos.js` › `ordenesCerradasDesde(desde)` filtra `created_at >= desde` y suma
`ordenes.total`. El dashboard le pasa la medianoche de hoy.

**Qué provoca:** una cuenta que se abre un día y se cobra al siguiente **no aparece en las
ventas de ningún día**. Hoy no, porque todavía no está cerrada; mañana tampoco, porque su
`created_at` ya no entra en el filtro. El dinero entró y el tablero nunca lo cuenta.

Medido el 2026-11-21: se cobraron **$343.00** en cinco pagos y el dashboard mostró
**$145.00**. Los $198.00 faltantes eran una cuenta abierta el 2026-11-14 y cobrada hoy.

**Y hay un segundo error en la misma función:** suma `ordenes.total`, que es lo que la cuenta
*debía*, no lo que se *cobró*. Con un cobro parcial a caballo entre dos días, o si algún día
se usa `descuento`, los dos números dejan de coincidir.

## Cómo se cerró

Las ventas del día ahora salen de `pagos_venta`, no de `ordenes`:

- `js/core/datos.js`: `ordenesCerradasDesde()` se reemplazó por `pagosDesde(desde)`, que trae
  `monto`, `orden_id`, `metodo_pago` y `fecha` de los pagos desde esa fecha.
- `js/pantallas/dashboard.js`: "Ventas de hoy" suma `monto`. "Órdenes de hoy" cuenta
  `orden_id` **distintos**, para que dos cobros parciales de la misma cuenta no cuenten doble.

No hizo falta tocar la base: `anon` ya tenía política y `GRANT` de `select` en `pagos_venta`.

Verificado el 2026-11-21 contra los mismos datos que descubrieron el error: el dashboard pasó
de **$145.00 / 3 órdenes** a **$343.00 / 4 órdenes**, que es exactamente lo que suman los cinco
pagos de ese día en `pagos_venta`, repartidos en cuatro cuentas.

`metodo_pago` viene en la consulta aunque el dashboard todavía no lo use: es lo que va a
necesitar el corte de caja (deuda 008), para desglosar efectivo, tarjeta y transferencia.

Ojo para los reportes históricos: los pagos anteriores al 2026-11-14 traen el monto inflado
(deuda 006), así que cualquier consulta que mire hacia atrás filtra por fecha. Queda anotado en
el comentario de `pagosDesde`.
