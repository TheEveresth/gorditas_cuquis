-- EJECUCION MANUAL. Un agente no ejecuta este script.
-- Plan:      009_DeudasBd          Paso: rollback
-- Proposito: devolver el permiso de ejecucion que quito 01_rls_revoke_rls_auto_enable.sql.
-- Requiere:  01_rls_revoke_rls_auto_enable.sql
-- Rollback:  este es el rollback
-- Verificar: proacl vuelve a mencionar anon y authenticated.

grant execute on function public.rls_auto_enable() to anon;
grant execute on function public.rls_auto_enable() to authenticated;

select p.proname, array_to_string(p.proacl, ' | ') as permisos
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'rls_auto_enable';
