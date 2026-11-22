# 012 — "Total cuenta" incluye lo ya pagado

**Riesgo:** bajo · **Estado:** abierta · Detectada el 2026-11-21 (probando el cobro parcial)

En `pos.html`, `calcularTotales()` suma **todos** los renglones para "Total cuenta", incluidos
los que ya están marcados como pagados. Lo que falta por cobrar aparece en "Total seleccionado".

**Qué provoca:** en un cobro parcial los dos números se separan y el de arriba se queda en el
importe original. Comprobado: de una cuenta de $53.00 se cobraron $25.00 y la pantalla siguió
mostrando "Total cuenta $53.00" con "Total seleccionado $28.00". No está mal calculado, pero en
el mostrador se lee como si faltaran $53.00.

**Cómo se cierra:** o "Total cuenta" pasa a sumar solo los renglones **no pagados**, o se
agrega un tercer renglón "Pagado" y se deja el total como está. Es decisión de cómo quiere
verlo el dueño, no un cálculo que arreglar.

Menor, del mismo paso y sin archivo propio: en `cuentas.html`, cuando una mesa no tiene
cuentas abiertas el mensaje dice "No hay cuentas que coincidan con la búsqueda" aunque no se
haya buscado nada.
