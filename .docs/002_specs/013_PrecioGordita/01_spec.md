# 013 — Precio de la gordita y catálogo real

**Estado:** abierto · Abierto el 2026-11-21

## Qué se busca

Que el POS cobre la gordita al precio que de verdad cuesta, sin que el cajero lo saque de
memoria. Hoy el sistema solo sabe de un precio plano por producto, así que una gordita de harina
con queso y requesón no se puede capturar: o se cobra mal, o se mete como "producto rápido" con
el precio escrito a mano.

Mientras eso siga así el POS no puede ser el único sistema del negocio, y el catálogo real
(≈45 productos y 16 guisos) no se puede cargar.

## Cómo cobra el negocio

De `.docs/001_arquitectura/reglas-negocio.md`, hoja `MODIFICADORES` y `EXCEPCIONES` del Excel:

| Regla | Detalle |
|---|---|
| Base de la gordita | **$14** con tortilla de maíz |
| Tortilla de harina | **+$1** sobre la base |
| Comisión del guiso | **+$2**, la estándar |
| Comisiones acumulables | si lleva varias (queso y requesón), **se suman**; no se toma la mayor |
| Excepciones | hay guisos que **no** cobran comisión. Es una lista, no una regla general |
| Descuento al personal | **−$2** sobre el precio resultante |

Ejemplo que tiene que cuadrar: **gordita de harina con queso y requesón = $19.**
`14 + 1 + 2 + 2`.

## Qué cambia para quien usa el POS

- Al capturar una gordita, el POS pide la tortilla y el guiso o los guisos, y **muestra el
  precio ya armado** antes de agregar el renglón.
- La cocina ve el guiso en la comanda. Hoy solo vería "Gordita", que no le sirve.
- El ticket y la pantalla de cobro muestran el renglón con lo que lleva.
- Un guiso exceptuado no suma nada, y eso lo decide el catálogo, no el cajero.

## Qué no entra

- **Descuento al personal.** La regla queda representable, pero quién lo autoriza y cómo se
  registra es el módulo `consumos_empleado`, que es su propio plan.
- **Pantalla de administración del catálogo.** Este plan carga el catálogo con un script; darle
  de alta un guiso desde el navegador es el plan siguiente.
- **Impresión del ticket y de la comanda.**
- **Inventario y recetas**, aunque `recetas` vaya a colgar del modelo que aquí se decida.

## Qué hace falta del dueño

El catálogo real sigue en `SistemaCuquis_Fase1.xlsm`. Para el paso 4 hacen falta, exportadas de
las hojas `CATALOGO`, `GUISOS` y `EXCEPCIONES`:

- los ≈45 productos con su categoría y su precio;
- los 16 guisos, y de cada uno **cuántas comisiones cobra** (0 si está exceptuado, 1 la normal,
  2 si acumula);
- si algún producto que no es gordita también lleva modificadores.

Sin eso el paso 4 no se puede escribir, y es lo único que bloquea el plan de punta a punta.
