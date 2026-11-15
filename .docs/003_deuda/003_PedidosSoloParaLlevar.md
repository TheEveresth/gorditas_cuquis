# 003 — Cocina no ve las órdenes de mesa

**Riesgo:** medio · **Estado:** abierta · Detectada el 2026-11-14

`js/pantallas/pedidos.js` consulta `ordenes` filtrando `tipo = 'para_llevar'`. Las órdenes de
mesa (`tipo = 'local'`, hoy la mayoría) **nunca aparecen** en la cola de la cocina.

**Qué provoca:** la comanda de mesa se sigue pasando de voz. `estado_preparacion` queda en
`pendiente` para siempre en las órdenes locales, así que tampoco sirve para medir nada.

**Cómo se cierra:** decidir primero con el usuario si cocina quiere las dos en la misma lista o
separadas por pestaña — no es solo quitar el filtro, cambia cómo se ve la pantalla en hora
pico. Después, quitar o condicionar el `.eq("tipo", "para_llevar")`.
