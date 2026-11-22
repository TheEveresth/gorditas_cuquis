# MEMORY.md — Gorditas Cuquis

Memoria curada entre sesiones. **Máximo 50 líneas.** Solo estado que caduca, decisiones sin
otro hogar y pendientes. No va aquí lo que ya está en `AGENTS.md`, en `.docs/001_arquitectura/`
ni en las skills. Los agentes **proponen** entradas; el usuario las aprueba. Sin secretos.

## Estado actual

- Supabase `fkzargiqommrbagqnemm`: una sola base para desarrollo y producción. El 2026-11-21 se
  cobraron $343 en 5 pagos de prueba; sigue abierta la cuenta "Elias" ($53). Ventas reales: 0.
- Catálogo mínimo: 1 empleado, 3 productos, 4 categorías, 4 mesas. El real (≈45 productos y
  16 guisos) sigue en el Excel. Conteos de filas: `count(*)`.
- `supabase-js` fijado en **2.119.2** en las ocho pantallas. Ya existe una línea `3.0.0-next`:
  no se sube de major sin probar las ocho.
- Pantallas vivas: login, dashboard, mesas, cuentas, tomar-orden, para-llevar, pedidos, pos.
  Falta: corte de caja, gastos, nómina, inventario, administración de catálogos.
- Rama de trabajo: `esantillan`. El remoto `origin` existe pero los agentes no lo tocan.
- El cobro quedó probado de punta a punta el 2026-11-21: parcial y total, con los tres métodos
  de pago. La base guarda el monto de los renglones, no lo recibido en efectivo.

## Decisiones (y por qué)

- 2026-11-21 — **No se migra a Angular ni a Next.js por ahora.** Primero las deudas y el
  catálogo con las reglas de precio. Se reabre cuando el cuello de botella sea la interfaz:
  tiempo real en cocina, estado compartido entre pantallas, o DOM repetido que ya duela. Si se
  migra, un SPA estático con build (Vite) antes que Next.js —su valor es el servidor y aquí no
  hay— o Angular, que es ceremonia de equipo grande.
  Por qué: el bloqueo de hoy es modelar el precio de la gordita, que es base de datos y no
  interfaz; y `datos.js` ya aísla las consultas, así que migrar después sigue siendo barato.
- 2026-11-14 — Los 37 pagos anteriores a esa fecha quedan con el monto inflado (≈$606 de más).
  No se corrigen: son datos de prueba de abril-mayo. Todo reporte de `pagos_venta` filtra fecha.
- 2026-11-14 — El cobro completo ocurre en la RPC `cobrar_items` (una transacción) y el monto lo
  calcula la base. Por qué: el navegador mandaba lo recibido en efectivo como monto cobrado.
- 2026-11-14 — Las contraseñas se verifican con `bcrypt` dentro de la base (`login_empleado`) y
  el navegador ya no lee la tabla `empleados`. Por qué: estaban en texto plano.
- 2026-11-14 — Las pantallas no consultan la base: toda consulta en `js/core/datos.js` y los
  datos de conexión en `js/core/conexion.js`. Por qué: los nombres de tablas estaban repartidos
  en ocho archivos. No cambia la seguridad: la llave es pública y protegen RLS, `GRANT` y RPC.
- 2026-11-14 — Skills canónicas en `.claude/skills/`, no en `.agents/` con enlaces como COMPRE.
  Por qué: una herramienta, una persona, y Windows no hace enlaces sin permisos de admin.
- 2026-11-14 — `efectivo_recibido` y `cambio` no se guardan; solo se muestran. Por qué: salieron
  de `monto` al arreglar el cobro y el corte de caja todavía no existe.

## Pendientes

- Cargar el catálogo real y modelar las reglas de precio de la gordita: hoy `productos` solo
  tiene `precio_venta` plano. Es el siguiente plan. Ver `.docs/003_deuda/`.
- 16 tablas con RLS prendido y **cero** políticas (nómina, inventario, gastos, clientes). Al
  darles pantalla hay que escribir política **y** `GRANT`.
- `.docs/002_specs/009_DeudasBd/sql/01_rls_revoke_rls_auto_enable.sql`: escrito, sin ejecutar.
