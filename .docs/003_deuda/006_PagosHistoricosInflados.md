# 006 — Los pagos viejos traen el monto inflado

**Riesgo:** bajo · **Estado:** **aceptada** (decisión del usuario, 2026-11-14)

Hasta el 2026-11-14, al cobrar en efectivo el navegador guardaba en `pagos_venta.monto` **lo
recibido**, no lo cobrado. Los 37 pagos anteriores a esa fecha suman ≈$606 de más contra el
total real de las órdenes. El bug está arreglado (el monto lo calcula `cobrar_items`).

**Decisión:** no se corrigen. Son datos de prueba de abril y mayo de 2026 y ninguna cuenta real
depende de ellos.

**Qué hay que recordar:** cualquier reporte, corte o suma sobre `pagos_venta` tiene que
**filtrar por fecha** (`fecha >= '2026-11-14'`) o va a salir inflado. Esto aplica al futuro
corte de caja.
