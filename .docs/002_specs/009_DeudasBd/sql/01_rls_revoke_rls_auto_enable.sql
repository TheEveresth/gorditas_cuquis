-- EJECUCION MANUAL. Un agente no ejecuta este script.
-- Plan:      009_DeudasBd          Paso: 1
-- Proposito: quitarle a anon y authenticated el permiso de ejecutar rls_auto_enable().
-- Requiere:  ninguno
-- Rollback:  99_rollback_rls_auto_enable.sql
-- Verificar: la consulta del final; proacl no debe mencionar anon ni authenticated.

-- OJO: esta funcion es la que usa el disparador de eventos `ensure_rls`, que Supabase
-- instala para prender RLS en cada tabla nueva. NO se borra: solo se le quitan permisos.
-- El disparador sigue funcionando, porque Postgres revisa el permiso al crear el
-- disparador, no cada vez que se dispara.

revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;
revoke execute on function public.rls_auto_enable() from public;

-- Verificacion (solo lectura): no debe aparecer anon= ni authenticated=
select p.proname, array_to_string(p.proacl, ' | ') as permisos
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'rls_auto_enable';

-- Verificacion 2: el disparador sigue activo ('O' = enabled)
select evtname, evtenabled from pg_event_trigger where evtname = 'ensure_rls';
