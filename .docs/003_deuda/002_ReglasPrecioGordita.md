# 002 — Las reglas de precio no se pueden representar

**Riesgo:** alto · **Estado:** abierta · Detectada el 2026-11-14

`productos` solo tiene `precio_venta` y `precio_empleado`: dos números planos. Las reglas reales
del negocio (ver `.docs/001_arquitectura/reglas-negocio.md`) son otra cosa:

- base $14 maíz, **+$1** si es harina;
- **+$2** de comisión por guiso, y las comisiones **se acumulan**;
- hay guisos exceptuados que no cobran comisión;
- **−$2** de descuento al personal.

**Qué provoca:** no hay dónde guardar nada de eso. Mientras siga así, el precio de una gordita
con dos comisiones lo calcula el cajero de memoria.

**Cómo se cierra:** el plan [013](../002_specs/013_PrecioGordita/), escrito el 2026-11-21. El
modelo elegido es producto base + modificadores con su propio precio, y **sin tabla de
excepciones**: cada guiso trae su `precio_delta`, así que un guiso exceptuado es un `0`.
Es el plan que desbloquea la deuda [001](001_CatalogoNoCargado.md).
