# Planes de cambio

Índice de los cambios que no caben en una sesión. Una línea por plan: es lo primero que se lee al
empezar, así que no crece a resumen. El procedimiento está en la skill `plan-cambio`.

| `NNN` | Plan | Estado | De qué se trata |
|---|---|---|---|
| [009](009_DeudasBd/) | Deudas de la base | abierto | `revoke` de `rls_auto_enable()`; script escrito, sin ejecutar |
| [013](013_PrecioGordita/) | Precio de la gordita y catálogo real | abierto | modelo de modificadores; scripts escritos, falta el export del Excel |

Estados: `abierto` (escrito, sin empezar), `en curso`, `cerrado`.

## Numeración única

`NNN` es de tres dígitos, consecutivo, y **no se reusa** ni se repite con los de
`.docs/003_deuda/`. Antes de crear una carpeta:

```bash
ls .docs/002_specs/
git ls-tree --name-only origin/main .docs/002_specs/   # sin fetch
```

Si el número choca, se avisa y se propone el siguiente libre. No se renombra sin confirmación.

## Qué lleva una carpeta

```
<NNN>_<NombreEnPascalCase>/
  01_spec.md      qué quiere el negocio, en palabras del negocio
  02_impacto.md   archivos y tablas que toca; deuda que roza
  03_pasos.md     pasos numerados con criterio de aceptación
  04_avance.md    lo hecho, con fecha, y la sección "Estado BD"
  sql/            scripts en orden; los ejecuta una persona, no el agente
```

## Candidatos (sin plan todavía)

En orden de lo que más haría falta, según `.docs/003_deuda/` y las reglas de negocio:

1. Pantalla de administración de catálogos (productos, categorías, mesas, empleados, guisos):
   es lo que sigue al plan 013, porque cargar el catálogo por script cada vez que cambia un
   precio no se sostiene.
2. Roles y permisos: `login_empleado` ya devuelve `rol_sistema_id` y **nadie lo lee**. Va antes
   de nómina e inventario, no después.
3. Corte de caja, que necesita guardar lo recibido en efectivo.
4. Ticket y comanda en la impresora de 58 mm.
5. Gastos, nómina e inventario: cada módulo es su propio plan, y el de nómina empieza por
   levantar las reglas con el dueño.

Ya no está en la lista: cargar el catálogo y modelar el precio de la gordita, que es el plan
[013](013_PrecioGordita/) desde el 2026-11-21; y que `pedidos.html` muestre las órdenes de mesa,
hecho el 2026-11-21 (deuda 003).
