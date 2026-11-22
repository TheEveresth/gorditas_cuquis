# 005 — El CDN de Supabase no fija versión

**Riesgo:** medio · **Estado:** cerrada el 2026-11-21 · Detectada el 2026-11-14

Las ocho pantallas cargaban la librería sin versión, así que cada carga traía la última
publicada:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
```

**Qué provocaba:** el día que `supabase-js` publicara un cambio incompatible, el POS dejaba de
funcionar en medio de un turno sin que nadie tocara el código. No era hipotético: al revisarlo
el 2026-11-21, el paquete ya tiene publicada una línea **`3.0.0-next`**. El día que ese 3.0
salga como estable, la etiqueta sin versión se lo habría traído solo.

## Cómo se cerró

Fijada la versión en las ocho pantallas:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.2"></script>
```

`2.119.2` era la última estable de la rama 2 ese día, así que el POS corre con la misma
librería que ya venía usando.

Verificado el 2026-11-21: siete de las ocho pantallas cargadas en el navegador, todas con
`supabase-js@2.119.2` como primer script, la librería disponible y **cero errores de consola**.
Falta `pos.html`: cargarla escribe en la cuenta abierta y no se probó por eso; su etiqueta es
idéntica a las demás y se cambió en el mismo paso.

**Para subir de versión:** se cambian las ocho a la vez y se vuelven a cargar las ocho. La
versión vigente se anota en `MEMORY.md`.
