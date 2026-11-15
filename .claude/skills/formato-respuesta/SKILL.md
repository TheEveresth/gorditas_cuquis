---
name: formato-respuesta
description: >
  Forma de las respuestas en el repo del POS Gorditas Cuquis: el orden de lo
  que se dice, cómo se reportan los cambios y los pendientes, y la línea de
  cierre "quién responde" con la skill usada, el contexto y los desvíos.
  Activa por defecto en toda sesión y en todo subagente; solo se quita si el
  usuario lo pide. Disparadores: "quién responde", "línea de contexto",
  "formato de respuesta", "quita la línea", "cómo me reportas", "resúmeme
  distinto".
---

# Skill: formato de respuesta

Activa por defecto. Sirve para que el usuario vea de un vistazo qué cambió, qué falta y con qué
reglas se trabajó, sin leer un muro de texto.

## Orden de la respuesta

1. **La respuesta primero.** Qué se hizo o cuál es el hallazgo, en una o dos frases. No se abre
   con el proceso ni con lo que se leyó.
2. **El detalle**, solo si aporta. Para varios cambios, una tabla:

   | Archivo | Qué cambió | Por qué |
   |---|---|---|

3. **Lo que falta o no se verificó**, explícito y sin suavizar: scripts SQL pendientes de
   ejecutar, lo que no se pudo probar, los datos de prueba que quedaron en la base.
4. **La línea de cierre.**

Nunca al revés: si el usuario solo lee los primeros renglones, tiene que haber leído lo que
importa.

## La línea de cierre

Una sola línea, sin viñetas:

```
🟦 **Chat** · Skill: <nombre | ninguna> · Contexto: <archivos o comandos clave> · Desvíos: <cuál | ninguno>
```

| Quién | Cuadro |
|---|---|
| Sesión principal | 🟦 |
| Subagente (lo transmite el chat) | 🟪 |

- **Skill:** las que se leyeron y se aplicaron en esta respuesta, separadas por coma.
- **Contexto:** 2 a 4 archivos o comandos que sostienen la respuesta. No la lista completa.
- **Desvíos:** cualquier cosa hecha fuera de `AGENTS.md` o de una skill (commitear sin la skill
  de commits, ejecutar algo en la base, no verificar un cambio). Si no hubo: `ninguno`.
- Si el trabajo lo hizo un subagente, el cuadro es de quien transmite y el subagente va en
  Contexto (`Contexto: subagente → pos.js`).

### Dónde va

| Caso | Posición |
|---|---|
| La respuesta termina sin pregunta | última línea |
| La respuesta pide una decisión o una confirmación | justo antes de la pregunta |
| Nunca | al principio: con el scroll se pierde |

Se omite solo en respuestas triviales de una frase. **No** se omite cuando se está pidiendo
permiso para commitear o para ejecutar algo.

## Lo que no se hace

- Repetir el contenido de los archivos que se acabaron de escribir.
- Un resumen largo de lo ya dicho en la misma respuesta.
- Felicitarse ("¡listo!", "perfecto") en lugar de decir qué quedó.
- Decir que algo funciona sin la comprobación de la skill `verificar-cambio`.
- Esconder un pendiente al final de un párrafo: va en su propia línea.

## Quitarla o cambiarla

Solo si el usuario lo pide. Es una preferencia de persona, no del repo: se anota en
`PREFERENCIAS.md`, no se edita esta skill. Si cambia para todos, se edita aquí.
