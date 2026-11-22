# 003 — Cocina no ve las órdenes de mesa

**Riesgo:** medio · **Estado:** cerrada el 2026-11-21 · Detectada el 2026-11-14

`js/pantallas/pedidos.js` consultaba `ordenes` filtrando `tipo = 'para_llevar'`. Las órdenes de
mesa (`tipo = 'local'`, la mayoría) **nunca aparecían** en la cola de la cocina.

**Qué provocaba:** la comanda de mesa se pasaba de voz. Y había una segunda causa que la nota
original no vio: la pantalla solo pintaba `en_produccion` y `listo`, pero una orden de mesa nace
`pendiente`, así que no habría aparecido ni quitando el filtro. Había 9 órdenes en `pendiente`
que nunca se vieron en pantalla.

## Cómo se cerró

El usuario decidió, el 2026-11-21: **una sola lista en orden de llegada**, con la etiqueta
"Mesa 3" o "Para llevar" en cada tarjeta, y `pendiente` junto con `en_produccion` en un solo
bloque "Por preparar" (un clic menos en hora pico que un botón "Empezar").

- `js/core/datos.js`: `pedidosParaLlevarAbiertos()` pasó a ser `ordenesAbiertasDeCocina()`, sin
  el `.eq("tipo", ...)` y con `mesas (numero, nombre)` en el `select` para poder etiquetar.
- `js/pantallas/pedidos.js`: grupos "Por preparar" (`pendiente` + `en_produccion`) y "Listas
  para entregar" (`listo`); el buscador también busca por mesa; al abrir una orden de mesa
  deja la mesa correcta en `localStorage` en vez de arrastrar la anterior.
- `pedidos.html`: títulos y contenedores (`cocinaPorPreparar`, `cocinaListos`).

Verificado en el navegador el 2026-11-21: las dos cuentas abiertas aparecen juntas, etiquetadas
"Para llevar / Elias" ($53.00) y "Mesa 2 / Local" ($198.00), en ese orden de llegada.

Probada de punta a punta el 2026-11-21: una orden nueva de la Mesa 3 (`pendiente`) aparece en
"Por preparar" etiquetada "Mesa 3", y "Marcar lista" la pasa a "Listas para entregar".

**Corrección a esta nota:** decía que nada escribe `estado_preparacion = 'entregado'`. Es falso:
lo pone la RPC `cobrar_items` al cerrar la cuenta. El ciclo completo sí queda registrado.
