# 007 — `rls_auto_enable()` lo puede ejecutar `anon`

**Riesgo:** medio · **Estado:** abierta · Detectada el 2026-11-14 (linter de Supabase)

En `public` hay una función `rls_auto_enable()` declarada `security definer` cuyo permiso de
ejecución alcanza a `anon` y `authenticated`. Una función `security definer` corre con los
permisos de su dueño: cualquiera con la llave pública la puede llamar.

**Qué provoca:** es una puerta que nadie abrió a propósito. No se sabe de un abuso, pero la
llave `publishable` está en el código fuente de un sitio estático: está al alcance de cualquiera
que abra el inspector.

**Cómo se cierra:** revisar qué hace y quién la llama (nada del POS la usa) y, en un script de
`sql/`, `revoke execute ... from public, anon, authenticated` o borrarla si quedó de una prueba.
Lo ejecuta el usuario. Mientras no se cierre, toda función nueva lleva su `revoke all` +
`grant execute to anon` explícito (skill `supabase-cuquis`).
