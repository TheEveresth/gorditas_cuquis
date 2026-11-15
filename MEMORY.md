# MEMORY.md — Gorditas Cuquis

Memoria curada entre sesiones. **Máximo 50 líneas.** Solo estado que caduca, decisiones sin
otro hogar y pendientes. No va aquí lo que ya está en `AGENTS.md`, en `.docs/001_arquitectura/`
ni en las skills. Los agentes **proponen** entradas; el usuario las aprueba. Sin secretos.

## Estado actual

- Supabase `fkzargiqommrbagqnemm`: una sola base para desarrollo y producción, y **en uso real**
  (el 2026-11-14 se cobraron órdenes mientras se trabajaba en el repo). Conteos: `count(*)`.
- Catálogo mínimo: 1 empleado, 3 productos, 4 categorías, 4 mesas. El catálogo real (≈45
  productos y 16 guisos) sigue en el Excel y no se ha cargado.
- Pantallas vivas: login, dashboard, mesas, cuentas, tomar-orden, para-llevar, pedidos, pos.
  Sin pantalla: corte de caja, gastos, nómina, inventario, administración de catálogos.
- Rama de trabajo: `esantillan`. El remoto `origin` existe pero los agentes no lo tocan.

## Decisiones (y por qué)

- 2026-11-14 — Los 37 pagos anteriores a esta fecha quedan con el monto inflado (≈$606 de más:
  en efectivo se guardaba lo recibido, no lo cobrado). No se corrigen.
  Por qué: son datos de prueba de abril-mayo y ninguna cuenta real depende de ellos. Cualquier
  reporte de `pagos_venta` tiene que filtrar por fecha.
- 2026-11-14 — El cobro completo ocurre en la RPC `cobrar_items` (una transacción) y el monto
  lo calcula la base a partir de los renglones.
  Por qué: el navegador mandaba lo recibido en efectivo como monto cobrado, y el cierre de la
  cuenta era un segundo viaje que podía fallar a medias.
- 2026-11-14 — Las contraseñas se verifican con `bcrypt` dentro de la base (`login_empleado`) y
  el navegador ya no puede leer la tabla `empleados`.
  Por qué: estaban en texto plano y la tabla era legible con la llave pública.
- 2026-11-14 — Las pantallas no consultan la base: toda consulta vive en `js/core/datos.js` y
  los datos de conexión en `js/core/conexion.js` (antes `config.js`).
  Por qué: los nombres de tablas y columnas estaban repartidos en ocho archivos, y cada pantalla
  cargaba doce líneas de manejo de error por consulta. Las ocho pantallas bajaron de 1836 a 1557
  líneas. No cambia nada de seguridad: la llave es pública por diseño y lo que protege la base
  son RLS, los `GRANT` y las RPC.
- 2026-11-14 — Las skills son canónicas en `.claude/skills/`, no en `.agents/` con enlaces como
  en COMPRE. Por qué: una sola herramienta, una sola persona, y Windows no crea enlaces
  simbólicos sin permisos de administrador.
- 2026-11-14 — `efectivo_recibido` y `cambio` no se guardan en ningún lado; solo se muestran.
  Por qué: salieron de `monto` al arreglar el cobro y el corte de caja todavía no existe.

## Pendientes

- Cargar el catálogo real (productos, categorías y guisos del Excel) y modelar las reglas de
  precio de la gordita: hoy `productos` solo tiene `precio_venta` plano.
  Ver `.docs/003_deuda/README.md`.
- 16 tablas tienen RLS prendido y **cero** políticas: son módulos sin estrenar (nómina,
  inventario, gastos, clientes). Al darles pantalla hay que escribir política **y** `GRANT`.
- `pedidos.html` filtra solo `tipo = para_llevar`: las órdenes de mesa nunca llegan a cocina.
- La etiqueta `<script>` del CDN de Supabase no fija versión.
