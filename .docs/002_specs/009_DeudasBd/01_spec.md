# 009 — Deudas de la base

**Estado:** abierto (script escrito, sin ejecutar) · Abierto el 2026-11-21

## Qué se busca

Cerrar la deuda [007](../../003_deuda/007_RlsAutoEnable.md): que `anon` y `authenticated` no
tengan permiso de ejecutar `public.rls_auto_enable()`.

## Qué se encontró al revisarla

La función es la que usa el disparador de eventos **`ensure_rls`**, que Supabase instala para
prender RLS automáticamente en cada tabla nueva. Dos consecuencias:

1. **No se borra.** Borrarla dejaría tablas nuevas sin RLS, que es peor que el permiso de más.
2. **El riesgo es menor de lo que decía la deuda.** La función devuelve `event_trigger`, y
   Postgres no deja llamar así una función: `anon` no la puede ejecutar aunque tenga el
   permiso. El `revoke` es higiene y callar al linter, no cerrar un hueco abierto.

Por eso la deuda 007 baja de riesgo **medio** a **bajo**.

## Impacto

- Base: solo permisos de una función. Sin DDL, sin datos.
- Código: ninguno. Nada del POS llama a esta función.
- Riesgo de ejecutarlo: bajo. Si el disparador dejara de funcionar, las tablas nuevas ya no
  prenderían RLS solas; el script trae la consulta que lo comprueba y su rollback.

## Pasos

1. El usuario corre `sql/01_rls_revoke_rls_auto_enable.sql` en el editor SQL de Supabase
   (como `postgres`, que es quien posee la función).
2. Revisar la salida: `permisos` sin `anon=` ni `authenticated=`, y `evtenabled = O`.
3. Anotar la fecha en `04_avance.md` y cerrar la deuda 007.

Si algo sale mal: `sql/99_rollback_rls_auto_enable.sql`.
