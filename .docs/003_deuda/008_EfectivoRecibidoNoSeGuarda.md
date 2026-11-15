# 008 — No se guarda lo recibido ni el cambio

**Riesgo:** medio · **Estado:** abierta · Detectada el 2026-11-14

`pos.html` pide lo recibido y muestra el cambio, pero **no se persiste nada**: `pagos_venta`
tiene `metodo_pago` y `monto`, y ya. Antes lo recibido se guardaba en `monto`, que era el bug;
al arreglarlo, el dato se quedó sin hogar.

**Qué provoca:** no se puede cuadrar la caja. Con el corte de caja no habrá forma de saber
cuánto efectivo entró ni cuánto se dio de cambio, solo cuánto se cobró.

**Cómo se cierra:** dos columnas nulas en `pagos_venta` (`efectivo_recibido numeric`,
`cambio numeric`), que `cobrar_items` las reciba y las guarde solo cuando el método es efectivo,
y que `pos.js` las mande. Es aditivo y cabe en el plan del corte de caja; no vale la pena como
cambio suelto.
