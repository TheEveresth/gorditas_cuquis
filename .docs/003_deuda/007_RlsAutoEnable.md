# 007 — `rls_auto_enable()` lo puede ejecutar `anon`

**Riesgo:** ~~medio~~ **bajo** (revisado el 2026-11-21) · **Estado:** en curso ·
Detectada el 2026-11-14 (linter de Supabase)

En `public` hay una función `rls_auto_enable()` declarada `security definer` cuyo permiso de
ejecución alcanza a `anon` y `authenticated`.

## Qué se encontró al revisarla (2026-11-21)

- Es la función del **disparador de eventos `ensure_rls`**, que Supabase instala para prender
  RLS en cada tabla nueva. **No se borra:** borrarla dejaría las tablas nuevas sin RLS, que es
  peor que el permiso de más. La nota original dejaba abierta esa opción; queda descartada.
- **El riesgo es menor del que se le puso.** La función devuelve `event_trigger`, y Postgres no
  deja invocar así una función: `anon` no la puede ejecutar aunque figure en el `proacl`. Por
  eso baja de **medio** a **bajo**: el `revoke` es higiene y callar al linter, no cerrar una
  puerta que esté abierta hoy.
- Nada del POS la llama. Quitarle el permiso no toca el código.

## Cómo se cierra

Script escrito, **lo ejecuta el usuario**:
`.docs/002_specs/009_DeudasBd/sql/01_rls_revoke_rls_auto_enable.sql`, con su rollback al lado.
Hace `revoke execute ... from anon, authenticated, public` y trae las dos consultas de
comprobación (que el `proacl` ya no los mencione y que `ensure_rls` siga activo).

El disparador sigue funcionando después del `revoke`, porque Postgres revisa el permiso al
crear el disparador, no cada vez que se dispara.

Mientras no se cierre, y después también: toda función nueva lleva su `revoke all` +
`grant execute to anon` explícito (skill `supabase-cuquis`).
