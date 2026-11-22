# 013 — Pasos

Cada paso se puede terminar y comprobar de una vez. Los scripts de `sql/` **los ejecuta el
usuario**, no el agente.

---

## Paso 1 — Cerrar las reglas con el dueño

Archivos: `01_spec.md`, `.docs/001_arquitectura/reglas-negocio.md`

Confirmar con el dueño, antes de tocar nada:

- ¿una gordita puede llevar **más de un guiso**, o uno solo que a veces cobra doble comisión?
  De eso depende el `maximo` del grupo `guiso`;
- ¿la tortilla de harina cuesta +$1 en **todo** lo que la lleve, o solo en la gordita?
- ¿hay algún producto que no sea gordita y lleve modificadores?

Criterio de aceptación: las tres respuestas escritas en `04_avance.md`, y `reglas-negocio.md`
actualizado si alguna contradice lo que hoy dice.

---

## Paso 2 — Crear las tablas

Archivos: `sql/01_ddl_modificadores.sql`, `sql/02_rls_modificadores.sql`

Los dos scripts, en ese orden y **en la misma sesión**: la tabla nace con RLS prendido por el
disparador `ensure_rls`, así que entre el `01` y el `02` no se puede leer nada.

Criterio de aceptación: la consulta del final del `02` muestra las tres tablas con su política y
el `GRANT` correspondiente para `anon`, y `select * from public.modificador_grupos` responde sin
`42501`.

Pendiente de ejecutar: `sql/01_ddl_modificadores.sql`, `sql/02_rls_modificadores.sql`

---

## Paso 3 — Sembrar los grupos y las tortillas

Archivos: `sql/03_seed_grupos_y_tortilla.sql`

Lo único que se puede sembrar sin el Excel: los dos grupos y las dos tortillas, que ya están en
`reglas-negocio.md`. Con los `minimo`/`maximo` que haya decidido el paso 1.

Criterio de aceptación: dos filas en `modificador_grupos` y dos en `modificadores`, y
`maíz` con `precio_delta = 0`, `harina` con `1`.

Pendiente de ejecutar: `sql/03_seed_grupos_y_tortilla.sql`

---

## Paso 4 — Cargar el catálogo real

Archivos: `sql/04_seed_catalogo.sql` *(no escrito todavía)*

**Bloqueado** hasta que llegue el export de las hojas `CATALOGO`, `GUISOS` y `EXCEPCIONES` (ver
`01_spec.md` › Qué hace falta del dueño). Con eso, el script da de alta los ≈45 productos, los
16 guisos con su `precio_delta`, y pone `grupos_modificadores = '{tortilla,guiso}'` en la
gordita.

Los 3 productos de prueba que hay hoy en la base se revisan en este paso: o se reusan o se
marcan `activo = false`. No se borran, porque hay órdenes de prueba que los referencian.

Criterio de aceptación: `select count(*) from productos where activo` da ≈45;
`select nombre, precio_delta from modificadores where grupo='guiso'` da 16 filas y los
exceptuados salen en `0`.

---

## Paso 5 — Capturar la gordita con sus modificadores

Archivos: `tomar-orden.html`, `js/pantallas/tomar-orden.js`, `js/core/datos.js`,
`css/03-pantallas.css`

Al tocar un producto que tenga `grupos_modificadores`, la pantalla pide primero los
modificadores, respetando `minimo` y `maximo`, y muestra el precio armado antes de agregar el
renglón. `precio_unitario` se guarda ya sumado, y los modificadores elegidos se guardan en
`orden_item_modificadores` con su `nombre` y `precio_delta` copiados.

Un producto sin `grupos_modificadores` se comporta exactamente como hoy.

Criterio de aceptación: capturada una gordita de **harina con queso y requesón**, la base
responde `precio_unitario = 19.00` en el renglón y tres filas en `orden_item_modificadores`
(`harina` 1, `queso` 2, `requesón` 2). Un refresco sigue agregándose con un toque.

---

## Paso 6 — Mostrar lo que lleva el renglón

Archivos: `js/pantallas/pos.js`, `js/pantallas/pedidos.js`, `js/core/datos.js`

El cobro y la comanda muestran cada renglón con sus modificadores: "Gordita de harina — queso,
requesón". La cocina lo necesita más que el cajero.

Aprovechando que se toca `pos.js`, cerrar aquí la deuda
[012](../../003_deuda/012_TotalCuentaIncluyeLoPagado.md).

Criterio de aceptación: la misma gordita del paso 5 se ve con sus tres modificadores en `pos.html`
y en `pedidos.html`, y el total de la cuenta deja de sumar lo ya pagado.

---

## Paso 7 — Cobrar y comprobar que la base no cambió de opinión

Archivos: ninguno (verificación)

Cobrar la cuenta de prueba y comprobar que `cobrar_items` —que **no se tocó**— guarda el monto
correcto.

Criterio de aceptación: `pagos_venta.monto` de ese cobro es igual a la suma de
`cantidad * precio_unitario` de los renglones cobrados, con la gordita de $19 dentro. Los datos
de prueba que queden se avisan y se acuerda cómo se limpian (skill `verificar-cambio`).

---

## Paso 8 — Cerrar

Archivos: `.docs/001_arquitectura/esquema-bd.md`, `reglas-negocio.md`,
`.docs/003_deuda/001_*`, `002_*`, `012_*`, `README.md` de deuda y de specs, `04_avance.md`

Las tablas nuevas al esquema; las reglas de precio pasan a "ya está en el sistema"; se cierran
las deudas 001, 002 y 012; el plan pasa a `cerrado`. Código y documentación en commits separados.
