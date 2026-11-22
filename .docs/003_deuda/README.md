# Deuda técnica

Lo que se sabe que está mal o incompleto, con su riesgo. Un archivo por deuda,
`<NNN>_<Nombre>.md`, con la numeración única compartida con `.docs/002_specs/`.

Esto no es una lista de deseos: aquí va lo que **ya es un problema** o lo que va a morder al
siguiente que toque esa zona. Lo que falta por construir va en `.docs/002_specs/README.md` ›
Candidatos.

| `NNN` | Deuda | Riesgo | Estado |
|---|---|---|---|
| [001](001_CatalogoNoCargado.md) | El catálogo real no está cargado | alto | abierta |
| [002](002_ReglasPrecioGordita.md) | Las reglas de precio no se pueden representar | alto | abierta |
| [003](003_PedidosSoloParaLlevar.md) | Cocina no ve las órdenes de mesa | medio | **cerrada** 2026-11-21 |
| [004](004_TablasSinPoliticas.md) | 16 tablas con RLS y sin políticas | bajo | abierta |
| [005](005_CdnSinVersion.md) | El CDN de Supabase no fija versión | medio | **cerrada** 2026-11-21 |
| [006](006_PagosHistoricosInflados.md) | Los pagos viejos traen el monto inflado | bajo | aceptada |
| [007](007_RlsAutoEnable.md) | `rls_auto_enable()` lo puede ejecutar `anon` | bajo | en curso |
| [008](008_EfectivoRecibidoNoSeGuarda.md) | No se guarda lo recibido ni el cambio | medio | abierta |
| [010](010_VentasDelDiaPorFechaDeAlta.md) | Las ventas del día se cuentan por fecha de alta | alto | **cerrada** 2026-11-21 |
| [011](011_TomarOrdenPierdeLaMesa.md) | Tomar orden pierde la mesa de la que vienes | alto | **cerrada** 2026-11-21 |
| [012](012_TotalCuentaIncluyeLoPagado.md) | "Total cuenta" incluye lo ya pagado | bajo | abierta |

Estados: `abierta`, `en curso`, `aceptada` (se decidió vivir con ella), `cerrada`.

Al cerrar una deuda se deja el archivo con la fecha y cómo se cerró; no se borra.
