---
name: plan-cambio
description: >
  Cómo documentar un cambio del POS Gorditas Cuquis que no cabe en una sesión:
  una carpeta numerada en `.docs/002_specs/` con la spec corta, los pasos, los
  scripts SQL y el avance, más el índice y la numeración única. También dice
  cuándo NO hace falta plan. Usar cuando el usuario pida un módulo o pantalla
  nueva, un cambio que toque el esquema de la base, o diga "haz un plan",
  "documenta el cambio", "qué sigue", "arma la spec", "divídelo en pasos" o
  describa algo que claramente lleva varias sesiones.
---

# Skill: plan de un cambio

## Cuándo sí y cuándo no

| Situación | Plan |
|---|---|
| Un arreglo, un texto, un estilo, un botón | **No.** Se hace y se verifica |
| Varias pantallas a la vez, o un módulo nuevo (corte de caja, gastos, nómina) | Sí |
| Cualquier cambio del esquema de la base, política o RPC | Sí (los scripts necesitan dónde vivir) |
| Algo que no se va a terminar hoy | Sí |

Un plan es para que la siguiente sesión no tenga que volver a deducir el contexto. Si el cambio
cabe en una respuesta, el plan cuesta más de lo que ahorra.

## La carpeta

`.docs/002_specs/<NNN>_<NombreEnPascalCase>/`, con `NNN` de tres dígitos consecutivo.

```
001_CorteDeCaja/
  01_spec.md        qué se quiere y para qué, en palabras del negocio
  02_impacto.md     qué archivos y tablas toca; qué deuda de .docs/003_deuda/ roza
  03_pasos.md       pasos numerados, cada uno con su criterio de aceptación
  04_avance.md      lo que se hizo, con fecha; incluye "Estado BD"
  sql/              scripts, en orden de ejecución (skill supabase-cuquis)
```

Si un plan no necesita SQL, no se crea la carpeta `sql/`.

### `01_spec.md`

Qué pide el negocio, en el lenguaje del negocio. Sin diseño técnico. Lo que **no** entra, dicho
en una línea. Si hay una regla de precios o de comisiones, se escribe aquí y luego se propone
para `.docs/001_arquitectura/reglas-negocio.md`.

### `03_pasos.md`

Un paso es algo que se puede terminar y verificar de una sola vez:

```markdown
## Paso 3 — Guardar el gasto

Archivos: `gastos.html`, `js/pantallas/gastos.js`, `sql/02_rls_gastos.sql`
Criterio de aceptación: con el script 02 corrido, un gasto dado de alta en la pantalla aparece
en `select * from gastos order by created_at desc limit 1` con el empleado correcto.
Pendiente de ejecutar: `sql/02_rls_gastos.sql`
```

Cada paso dice qué archivos toca, cómo se comprueba, y si deja algo pendiente de correr.

### `04_avance.md`

Se escribe al cerrar cada paso, con fecha. Lleva una sección **Estado BD** con qué script se
ejecutó, cuándo y quién. Una decisión que cambie el plan se **agrega** como entrada nueva; no se
reescribe la anterior.

## Numeración única

`NNN` no se repite ni se reusa, tampoco entre `.docs/002_specs/` y `.docs/003_deuda/`. Antes de
crear la carpeta se revisa el índice y el repo:

```bash
ls .docs/002_specs/
git ls-tree --name-only origin/main .docs/002_specs/   # sin fetch
```

Si choca, se avisa y se propone el siguiente libre; no se renombra nada sin confirmación.

## Índice

Cada plan se agrega a `.docs/002_specs/README.md` con una línea: `NNN` · nombre · estado
(`abierto`, `en curso`, `cerrado`) · una frase. El índice es lo que se lee al empezar una
sesión, así que no crece a resumen.

## Al cerrar un plan

1. `04_avance.md` dice qué quedó y qué no.
2. Los scripts que el usuario ya corrió quedan marcados en "Estado BD".
3. Lo que caduque (un pendiente, una decisión) se **propone** para `MEMORY.md`.
4. Lo que quedó a medias y es un riesgo se anota como deuda en `.docs/003_deuda/`.
5. El estado del índice pasa a `cerrado`.
6. Los commits: el código y la documentación van por separado (skill `git-commit-cuquis`).

## No hacer

- Un plan para un cambio de una línea.
- Escribir la spec después de hacer el cambio para que cuadre.
- Dejar los scripts SQL fuera de `sql/` o, peor, ejecutarlos.
- Borrar una decisión del avance porque ya no aplica: se agrega la nueva.
