---
name: pantalla-cuquis
description: >
  Contrato de una pantalla del POS Gorditas Cuquis: qué archivos la forman,
  en qué orden se cargan, dónde va cada estilo, cómo se navega entre
  pantallas, qué guarda localStorage y qué patrones se repiten al consultar
  Supabase. Incluye qué archivos leer (y cuáles no) para ahorrar contexto.
  Usar al crear una pantalla nueva, al modificar una existente, al mover algo
  de lugar entre `js/core/` y `js/pantallas/`, y cuando se hable de
  "pantalla", "página", "vista", "agregar un botón", "la hoja de estilos",
  "el layout" o "no se ve el cambio".
---

# Skill: pantallas del POS Gorditas Cuquis

Sitio estático, sin build, sin npm, sin framework. Se abre el HTML y corre.

## Las tres piezas

Una pantalla son tres cosas, y el nombre las amarra:

| Pieza | Ruta | Obligatorio |
|---|---|---|
| Marcado | `<pagina>.html` (en la raíz) | sí |
| Comportamiento | `js/pantallas/<pagina>.js` — **mismo nombre** que el html | sí |
| Estilos propios | un bloque en `css/03-pantallas.css` | solo si los necesita |

`index.html` es el login y su script es `js/pantallas/index.js`.

Las páginas viven en la raíz a propósito: son las URLs del sistema y los enlaces entre
pantallas son relativos y planos (`window.location.href = "pos.html"`).

## Orden de carga (no se cambia)

```html
<link rel="stylesheet" href="css/01-base.css">
<link rel="stylesheet" href="css/02-componentes.css">
<link rel="stylesheet" href="css/03-pantallas.css">
...
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
<script src="js/core/conexion.js"></script> <!-- define db -->
<script src="js/core/datos.js"></script>    <!-- define datos -->
<script src="js/core/sesion.js"></script>   <!-- define empleado y cerrarSesion -->
<script src="js/pantallas/<pagina>.js"></script>
```

`index.html` es la **única** que no carga `sesion.js`: ese archivo manda al login si no hay
empleado, y en el login daría una vuelta infinita.

## Qué da `js/core/`

| Global | De dónde sale | Qué es |
|---|---|---|
| `db` | `conexion.js` | el cliente de Supabase. **Nunca** se crea otro con `createClient`, y una pantalla no lo usa directo |
| `datos` | `datos.js` | todas las operaciones contra la base: `datos.productosActivos()`, `datos.cobrarItems(...)` |
| `empleado` | `sesion.js` | el empleado de `localStorage`; si no hay, ya redirigió al login |
| `cerrarSesion()` | `sesion.js` | limpia `localStorage` y vuelve al login |

Son scripts clásicos: un `const` del nivel superior es del script, **no** de `window`.
`typeof window.db` responde `undefined` aunque `db` exista. No sirve para comprobar si cargó.

## Lo que guarda localStorage

| Llave | Quién la pone | Quién la lee |
|---|---|---|
| `empleado` | `index.js` al entrar | todas, vía `sesion.js` |
| `mesa` | `mesas.js` al elegir mesa | `cuentas.js`, `pos.js` |
| `ordenActual` | `cuentas.js`, `pedidos.js`, `para-llevar.js` | `pos.js` (y la borra al cobrar) |

Una pantalla que necesite algo más de `localStorage` lo declara aquí antes de usarlo.

## Navegación

```
index -> dashboard -> mesas -> cuentas -> tomar-orden
                   -> para-llevar -> pos
                   -> pedidos -> pos
cuentas/pedidos -> pos -> (cobra) -> cuentas o pedidos
```

`pos.js` tiene su propio `volverACuentas()` porque depende de si hay `mesa`: eso es de la
pantalla, no de `core`.

## Dónde va cada estilo

| Va en | Qué |
|---|---|
| `01-base.css` | variables de marca, reset, `body`, barra superior |
| `02-componentes.css` | lo que usan varias pantallas: `.panel`, `.productos-grid`, `.carrito-*`, `.pago-box`, botones |
| `03-pantallas.css` | lo de una sola pantalla: layout del POS, login, dashboard, modales, paquetes |

Se cargan en ese orden, así que `03` le gana a `02` **por orden**, no con `!important`.
Si un ajuste necesita `!important`, está en el archivo equivocado.

**El atributo `style=""` del HTML le gana a cualquier regla de la hoja.** Si un elemento tiene
que poder ocultarse o cambiar desde CSS, no lleva `style`: lleva clase. Fue el bug del botón
"Mostrar/Ocultar productos" (2026-11-14): el `style="display:flex"` del `div` anulaba la regla
que lo escondía.

## Patrón para consultar la base

Una pantalla **no** escribe `db.from(...)` ni `db.rpc(...)`. Le pide la operación a `datos`:

```js
const productos = await datos.productosActivos();

if (!productos) return;   // datos.js ya aviso del error
```

El contrato de `js/core/datos.js`, igual en todas sus funciones:

| Tipo de operación | Devuelve | Si falla |
|---|---|---|
| lectura o alta | el dato | `null`, y ya avisó al usuario |
| cambio o borrado | `true` | `false`, y ya avisó al usuario |

Por eso en la pantalla basta `if (!x) return;`. El texto del aviso se ajusta por pantalla con el
parámetro opcional `mensaje`: `datos.ordenPorId(id, "Error al abrir cuenta")`.

**Si falta una operación, se agrega a `datos.js`**, en su sección, con un comentario de una línea
si hace algo que el nombre no dice. No se mete la consulta en la pantalla "nomás por esta vez":
ahí empieza la duplicación que esa capa vino a quitar.

- Lo que tiene que pasar completo o no pasar (cobrar, cerrar una cuenta) va en una RPC, no en
  dos llamadas seguidas: skill `supabase-cuquis`.
- Los importes se imprimen con `.toFixed(2)`; los que se guardan los calcula la base.
- Una pantalla no lee la tabla `empleados`: no es legible desde el navegador, a propósito.

## Pantalla nueva: pasos

1. Copiar el `<head>`, la barra superior y el bloque de `<script>` de una pantalla parecida
   (`mesas.html` es la más corta).
2. Crear `js/pantallas/<pagina>.js` con el mismo nombre. Las funciones que llama el HTML con
   `onclick` tienen que ser del nivel superior del archivo.
3. Estilos propios en `03-pantallas.css`, bajo un comentario con el nombre de la pantalla.
4. Si la pantalla lee o escribe una tabla sin políticas, el permiso es un script SQL aparte y lo
   corre el usuario (skill `supabase-cuquis`). La pantalla no se "arregla" abriendo la tabla.
5. Agregarla a la tabla de pantallas de `README.md` y al árbol de `AGENTS.md`.
6. Verificarla en el navegador antes de decir que quedó (skill `verificar-cambio`).

## Para no gastar contexto

- Para tocar una pantalla basta con **dos** archivos: su `.html` y su `.js`; si además cambia lo
  que le pide a la base, `js/core/datos.js`. No hace falta leer las demás pantallas.
- Para saber qué puede pedirle el navegador a la base:
  `grep -n "  async " js/core/datos.js`. Sale más barato que leer las ocho pantallas.
- Las hojas de estilo no se leen completas: `grep -n "<selector>" css/*.css` y se lee ese rango.
  `pos.js` tampoco (es el archivo más grande): `grep -n "function " js/pantallas/pos.js` primero.
- El esquema de la base no se consulta a la base: está en
  `.docs/001_arquitectura/esquema-bd.md`. Solo se consulta Supabase cuando el dato de ahí no
  alcanza o se sospecha que cambió.
- Lo que ya se sabe del sistema está en `.docs/` y en `MEMORY.md`: leerlos sale más barato que
  volver a deducirlo del código.

## `datos.js` no es seguridad

Centralizar las consultas hace el código más limpio, no más seguro: cualquiera puede llamar a la
base por su cuenta con la llave pública de `conexion.js`. Lo que se puede hacer o no lo deciden
las políticas RLS, los `GRANT` y las RPC de la base. Skill `supabase-cuquis`.
