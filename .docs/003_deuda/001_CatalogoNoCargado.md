# 001 — El catálogo real no está cargado

**Riesgo:** alto · **Estado:** abierta · Detectada el 2026-11-14

En la base hay **3 productos y 4 categorías**. El catálogo real son ≈45 productos y 16 guisos, y
sigue en las hojas `CATALOGO` y `GUISOS` de `SistemaCuquis_Fase1.xlsm`.

**Qué provoca:** el POS no se puede usar como único sistema. Todo lo que no está en el catálogo
se cobra como "producto rápido" con precio escrito a mano, así que los reportes por producto no
sirven y el precio depende de quién cobre.

**Por qué no está hecho:** cargar el catálogo sin resolver antes la deuda
[002](002_ReglasPrecioGordita.md) obliga a dar de alta una fila por combinación de tortilla y
guiso, que es el camino que no se quiere.

**Cómo se cierra:** un plan en `.docs/002_specs/` que primero modele el precio y luego cargue el
catálogo con un script `seed` que ejecute el usuario.
