# 005 — El CDN de Supabase no fija versión

**Riesgo:** medio · **Estado:** abierta · Detectada el 2026-11-14

Las ocho pantallas cargan la librería así:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
```

Sin versión. Cada carga trae la última publicada.

**Qué provoca:** el día que `supabase-js` publique un cambio incompatible, el POS deja de
funcionar **en medio de un turno**, sin que nadie haya tocado el código, y sin una pista de qué
pasó. Es el tipo de falla que cuesta horas encontrar.

**Cómo se cierra:** fijar la versión mayor y menor en las ocho pantallas
(`@supabase/supabase-js@2.x.y`), probar que todo sigue cargando, y anotar en `MEMORY.md` qué
versión quedó. Se cambia junto con la verificación de las ocho pantallas, no de a una.
