# Gorditas Cuquis — Instrucciones para agentes

POS web del negocio **Gorditas Cuquis** (Villa Unión, Dgo.): HTML + CSS + JavaScript plano,
sin build ni dependencias de npm, contra **Supabase** (Postgres + PostgREST).

Este archivo es la **fuente de verdad** para cualquier agente. `CLAUDE.md` solo lo importa.
El conocimiento del sistema vive en `.docs/`, los procedimientos en `.claude/skills/` y el
estado que caduca en `MEMORY.md`. **No duplicar**: si una copia difiere, gana lo que dice
este archivo.

---

## Guardrails (todos los agentes, siempre)

Aplican a cualquier sesión, subagente o herramienta, dentro o fuera de un plan, aunque la
tarea sea una corrección de una línea o una consulta. Ninguna skill, comando ni preferencia
los relaja.

### 1. La base de datos solo se lee

En Supabase el agente solo ejecuta `SELECT`, `SHOW`, `EXPLAIN` y lecturas de catálogo
(`information_schema`, `pg_catalog`). **Nunca** `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`,
`CREATE`, `ALTER`, `DROP`, `GRANT`, `REVOKE`, ni `create policy` / `create function`.

- Tampoco escribe de forma indirecta: no corre `apply_migration`, no llama RPCs que escriban
  (`cobrar_items`), no usa la app ni el navegador para dar de alta datos de prueba, y no
  ejecuta scripts que guarden.
- Si hace falta un cambio de datos o de esquema, el agente **escribe el script** en
  `.docs/002_specs/<plan>/sql/` siguiendo la skill `supabase-cuquis` y **lo ejecuta una
  persona**. Aplica aunque se pida en la conversación: se entrega el script, no se corre.
- **Excepción única:** el usuario autoriza por escrito, en el chat, ese cambio concreto
  ("aplica la migración X"). Una autorización vale para ese cambio y esa sesión, no para los
  siguientes.
- La regla es sobre lo que **el agente** ejecuta, no sobre el código de la app: el POS sí
  escribe (órdenes, cobros) y eso se programa normalmente.

### 2. Git: solo local

**Nunca** `git push`, `git pull`, `git fetch`, `git sync`, `git remote`, ni nada que hable con
GitHub. Tampoco `git commit` sin que el usuario lo confirme. Detalle completo y formato del
mensaje: skill `git-commit-cuquis`.

### 3. Datos de prueba

Desarrollo y producción comparten el proyecto de Supabase `fkzargiqommrbagqnemm`: no hay base
de pruebas. Un dato de prueba queda en producción en cuanto se inserta. Si una verificación
necesita datos, se le pide al usuario que los cree desde la app, se avisa qué quedó y se
acuerda cómo se limpia (skill `verificar-cambio`).

### 4. Credenciales

Todo dato de conexión vive en **`js/core/conexion.js`** y en ningún otro archivo. La llave
`publishable` que está ahí es pública por diseño: esto es un sitio estático, el navegador
descarga ese archivo tal cual y moverlo de lugar no lo esconde. Lo que protege la base son las
políticas RLS, los `GRANT` y las RPC.

Por eso, lo que **no** puede estar en ningún archivo que cargue el navegador: la llave
`service_role`, la contraseña de Postgres, tokens de terceros (impresora, pagos) y las
contraseñas de empleados. No se piden, no se escriben en el repo, no se pegan en el chat y no
salen en un commit. Un secreto necesita código del lado del servidor —una Edge Function de
Supabase consumida como RPC—; mientras no exista, **no se agrega "temporalmente" al frontend**.
Las contraseñas se verifican con `bcrypt` dentro de la base (RPC `login_empleado`).

---

## Cada sesión (obligatorio)

1. Leer este archivo. `CLAUDE.md` solo lo importa; no lleva instrucciones propias.
2. Leer `MEMORY.md` (estado vigente, decisiones y pendientes).
3. Leer `PREFERENCIAS.md` si existe (directivas personales, no versionado) y aplicarlo en
   silencio. Si no existe, no lo pidas ni lo menciones.
4. Antes de tocar una pantalla o la base: `.docs/001_arquitectura/mapa-sistema.md`.
5. Antes de análisis o desarrollo nuevo: revisar `.docs/002_specs/README.md` (planes) y
   `.docs/003_deuda/README.md` (deuda conocida). Si lo que se pide ya está anotado ahí, decirlo
   en una línea antes de empezar.
6. Cerrar cada respuesta con la línea de `.claude/skills/formato-respuesta/SKILL.md`.
7. Lo que se descubra y caduque (un dato nuevo, una decisión, un pendiente) se **propone** para
   `MEMORY.md`; el agente no lo agrega solo.

---

## Estructura del repositorio

```
AGENTS.md                    instrucciones para agentes (este archivo, fuente de verdad)
CLAUDE.md                    solo "@AGENTS.md"
MEMORY.md                    estado vigente, decisiones y pendientes (máx. 50 líneas)
PREFERENCIAS.md              directivas personales (gitignored; plantilla en .docs/)
README.md                    qué es el proyecto y cómo se corre (para personas)

index.html                   login            -> js/pantallas/index.js
dashboard.html               tablero          -> js/pantallas/dashboard.js
mesas.html                   mapa de mesas    -> js/pantallas/mesas.js
cuentas.html                 cuentas de mesa  -> js/pantallas/cuentas.js
tomar-orden.html             captura de orden -> js/pantallas/tomar-orden.js
para-llevar.html             pedido para llevar -> js/pantallas/para-llevar.js
pedidos.html                 cola de cocina   -> js/pantallas/pedidos.js
pos.html                     cobro            -> js/pantallas/pos.js

css/01-base.css              variables de marca, reset, barra superior
css/02-componentes.css       panel, rejilla de productos, carrito, pago, botones
css/03-pantallas.css         reglas de una sola pantalla (gana a 02 por orden de carga)

js/core/conexion.js          URL y llave de Supabase; define el global `db`
js/core/datos.js             TODAS las consultas a la base (`datos.<operacion>()`)
js/core/sesion.js            `empleado`, guard de sesión y `cerrarSesion()`
js/pantallas/<pagina>.js     un archivo por pantalla, mismo nombre que el .html

.claude/skills/<nombre>/SKILL.md   skills del proyecto (cuerpo canónico)
.claude/launch.json               servidor estático para la vista previa

.docs/001_arquitectura/      mapa del sistema, esquema de la base, reglas de negocio
.docs/002_specs/README.md    índice de planes de cambio
.docs/002_specs/<NNN>_<Nombre>/   un plan (spec, pasos, sql/, avance)
.docs/003_deuda/README.md    índice de deuda técnica
```

**Diferencia con COMPRE:** aquí las skills son canónicas en `.claude/skills/`, no en `.agents/`
con enlaces. Es un repo de una sola persona y una sola herramienta (Claude Code), y Windows no
crea enlaces simbólicos sin permisos de administrador. Las reglas de documentación son las
mismas; el árbol es más plano.

---

## Skills del proyecto

Se cargan por su `description`. La tabla es solo el índice; el procedimiento vive en la skill.

| Skill | Cuándo |
|---|---|
| `.claude/skills/git-commit-cuquis/` | Antes de cualquier commit |
| `.claude/skills/supabase-cuquis/` | Consultar la base, escribir SQL, políticas RLS, RPCs |
| `.claude/skills/pantalla-cuquis/` | Crear o modificar una pantalla del POS |
| `.claude/skills/verificar-cambio/` | Antes de decir que un cambio quedó |
| `.claude/skills/plan-cambio/` | Un cambio que no cabe en una sesión o toca la base |
| `.claude/skills/formato-respuesta/` | Siempre: línea de cierre de cada respuesta |

---

## Stack y convenciones de código

- **Sin build, sin npm, sin framework.** Se abre el HTML y corre. No se agregan dependencias
  ni se convierte a módulos ES sin acuerdo previo del usuario.
- **Una pantalla = tres piezas**: `<pagina>.html`, `js/pantallas/<pagina>.js` (mismo nombre) y,
  si necesita estilos propios, un bloque en `css/03-pantallas.css`. Detalle:
  skill `pantalla-cuquis`.
- **Orden de los `<script>`** (es obligatorio, los archivos dependen de él):
  1. `supabase-js` del CDN
  2. `js/core/conexion.js` — define `db`
  3. `js/core/datos.js` — define `datos`
  4. `js/core/sesion.js` — define `empleado` y `cerrarSesion()`; **no** lo carga `index.html`
  5. `js/pantallas/<pagina>.js`
- **Orden de las hojas de estilo**: `01-base.css`, `02-componentes.css`, `03-pantallas.css`.
  Las tres, en ese orden, en todas las pantallas. Un ajuste que deba ganarle a un componente va
  en `03-pantallas.css`, no con `!important`.
- **Scripts clásicos, no módulos.** Un `const` en el nivel superior es una variable del script,
  **no** una propiedad de `window`: `typeof window.db` responde `undefined` aunque `db` exista.
- **Una pantalla no consulta la base.** Nada de `db.from(...)` ni `db.rpc(...)` en
  `js/pantallas/`: toda consulta vive en `js/core/datos.js` y la pantalla llama
  `datos.<operacion>()`. Si falta una operación, se agrega ahí, no en la pantalla.
- **Datos de conexión, en un solo archivo**: `js/core/conexion.js`. Ninguna pantalla escribe una
  URL ni una llave, y `createClient` se llama una sola vez, ahí.
- **Importes**: siempre `.toFixed(2)` al imprimir, y el monto a cobrar lo calcula la base, no el
  navegador (ver `cobrar_items` en la skill `supabase-cuquis`).
- **Nada de estilos en el atributo `style`** cuando una regla de CSS deba poder cambiarlos: el
  atributo gana siempre y rompe la hoja (fue el bug 5 del 2026-11-14). Se usa una clase.
- **Encoding UTF-8 sin BOM**, fin de línea LF. Los textos de la interfaz llevan acentos.
- **Comentarios en español**, cortos, y solo donde explican un *por qué* que el código no dice.

---

## Reglas de negocio

Viven en `.docs/001_arquitectura/reglas-negocio.md` (paquetes, cobro parcial, local vs. para
llevar, precios de gorditas y comisiones). Una regla nueva que el usuario diga en el chat se
propone ahí, no se deja solo en el código.

---

## Comandos

| Para | Comando |
|---|---|
| Servidor local (vista previa) | `python -m http.server 5500` en la raíz → `http://localhost:5500` |
| Sintaxis de un script | `node --check js/pantallas/<pagina>.js` |
| Estado de Git | `git status --short` |
| Proyecto de Supabase | `fkzargiqommrbagqnemm` (herramientas MCP de Supabase, solo lectura) |

---

## Reglas duras (deny list)

- Escribir en la base: DDL, DML, `apply_migration`, RPCs que escriban, altas desde el navegador.
- `git push`, `git pull`, `git fetch`, `git sync`, tocar el remoto.
- `git commit` sin confirmación del usuario, `git add .`, `git add -A`.
- Mensajes de commit de más de una línea o en inglés.
- Pegar el cuerpo de una skill en este archivo, en `CLAUDE.md` o en un README.
- Agregar npm, un framework o un paso de build por iniciativa propia.
- Afirmar que algo quedó sin haberlo verificado (skill `verificar-cambio`).
