# 004 — 16 tablas con RLS y sin políticas

**Riesgo:** bajo · **Estado:** abierta · Detectada el 2026-11-14

Las tablas de nómina, inventario, gastos, clientes y catálogos auxiliares tienen RLS prendido y
**cero políticas** (lista en `.docs/001_arquitectura/esquema-bd.md`).

**Qué provoca:** nada hoy — son módulos sin estrenar y nadie las consulta. El riesgo es de
diagnóstico: quien vea el linter de Supabase puede creer que algo está roto, y quien les haga
una pantalla puede "arreglar" el permiso abriendo la tabla a `anon` en lugar de pensar qué debe
ver el navegador.

**Cómo se cierra:** cada módulo, al recibir su pantalla, define su política **y** su `GRANT` en
un script de `sql/`. Lo sensible (sueldos, costos) no se abre: se expone con una RPC. Ver skill
`supabase-cuquis`.
