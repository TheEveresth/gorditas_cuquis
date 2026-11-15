---
name: git-commit-cuquis
description: >
  Protocolo para preparar commits en el repositorio del POS Gorditas Cuquis:
  un commit por entrega lógica, desarrollo y documentación separados, `git add`
  con los archivos nombrados uno por uno, y mensaje de una sola línea en
  español sin trailers. Prohibido push, pull, fetch y cualquier trato con el
  remoto. Usar siempre que haya que registrar cambios en Git o el usuario diga
  "haz el commit", "commitea", "sube los cambios", "prepara el commit",
  "arma los commits" o "guarda esto en git". El commit nunca se ejecuta sin
  confirmación explícita del usuario en el chat.
---

# Skill: commits del POS Gorditas Cuquis

## Reglas absolutas

| # | Regla |
|---|---|
| 1 | **PROHIBIDO** correr `git commit` sin confirmación explícita del usuario. |
| 2 | **NUNCA** `git push`, `git pull`, `git fetch`, `git sync`, ni cambiar el remoto. Solo commits locales. |
| 3 | **NUNCA** `git add .` ni `git add -A`. Cada archivo se nombra en el comando. |
| 4 | **NUNCA** un solo commit con todo mezclado. Desarrollo y documentación van en commits distintos. |
| 5 | El mensaje es **una sola línea**, en español, máximo 72 caracteres. Sin cuerpo. |
| 6 | **NUNCA** un trailer: `Co-authored-by:`, `Co-Authored-By:`, `Generated with`, `Signed-off-by:`. Una línea quiere decir una línea. |
| 7 | No se commitea `PREFERENCIAS.md` (está en `.gitignore`) ni nada con credenciales. |

La regla 6 vale incluso si la herramienta sugiere agregar atribución: en este repo el mensaje es
solo el asunto.

---

## Fase 1 — Ver qué hay

```bash
git status --short
git diff --stat HEAD
```

Clasificar cada archivo en grupos. Los grupos de este repo:

| Grupo | Archivos |
|---|---|
| `pos`, `cuentas`, `mesas`, `pedidos`, `login`, `dashboard`, `tomar-orden`, `para-llevar` | la pantalla y su `js/pantallas/<pagina>.js` |
| `core` | `js/core/conexion.js`, `js/core/datos.js`, `js/core/sesion.js` |
| `css` | `css/*.css` |
| `docs` | `.docs/`, `README.md` |
| `agentes` | `AGENTS.md`, `CLAUDE.md`, `MEMORY.md`, `.claude/` |
| `bd` | scripts de `.docs/002_specs/<plan>/sql/` |

Un cambio que toca una pantalla y su hoja de estilos **sí** va junto: es una entrega.
Un cambio de código y la actualización de `.docs/` o `MEMORY.md` **no**: son dos commits.

---

## Fase 2 — Verificación previa

Antes de armar el stage, por cada archivo del commit:

1. **Sintaxis de JavaScript**: `node --check js/pantallas/<pagina>.js`.
2. **Integridad**: `tail -n 3 <archivo>` — que no quedó cortado a media función.
3. **Restos de depuración**: `grep -n 'console.log\|debugger\|TODO quitar' <archivo>`.
4. **Nada de secretos**: `git diff --cached | grep -ni 'service_role\|secret\|password ='`.
   Si aparece algo, detener y avisar. El único dato de conexión que puede ir en un commit es la
   llave `publishable` de `js/core/conexion.js`.
   Y antes de agregar un archivo nuevo que no sea código ni documentación, revisar que
   `.gitignore` ya lo cubra: `git check-ignore -v <archivo>`.
5. **SQL**: si el commit incluye scripts de `sql/`, que lleven el encabezado de
   `supabase-cuquis` y que **no** se hayan ejecutado desde el agente.
6. **Numeración**: si incluye una carpeta nueva de `.docs/002_specs/` o un archivo de
   `.docs/003_deuda/`, revisar que el prefijo `NNN_` no exista ya con otro nombre, en local y
   en lo que haya del remoto (`git ls-tree --name-only origin/main .docs/002_specs/`, **sin
   fetch**). Si choca, detener, avisar y proponer el siguiente libre.

---

## Fase 3 — El mensaje

Formato: `<tipo>(<grupo>): <descripción en imperativo>` — una línea, español, máx. 72 caracteres.

Tipos: `fix`, `feat`, `refactor`, `docs`, `style`, `chore`.

```
fix(pos): cobrar el monto de los renglones y no lo recibido
refactor(core): mover el guard de sesion a js/core/sesion.js
docs(agentes): agregar AGENTS.md y las skills del proyecto
```

Escribir el asunto en `_git_msg.txt` y commitear con:

```bash
git commit --cleanup=verbatim -F _git_msg.txt
```

Después, **obligatorio**:

```bash
git log -1 --format=%B
```

Si salió algún trailer (lo inyecta la herramienta, no la skill), enmendar en el momento con el
mismo asunto y volver a revisar. Solo si ese commit lo acabó de crear el agente:

```bash
git commit --amend --cleanup=verbatim -F _git_msg.txt
```

Repetir hasta que el cuerpo sea **exactamente** el asunto y un salto de línea. Borrar
`_git_msg.txt` al terminar.

---

## Fase 4 — Preparar y pedir permiso

1. `git add <ruta/archivo>` por cada archivo del grupo. Nunca un punto.
2. `git status --short` para que se vea qué quedó en el stage y qué no.
3. **Pedir confirmación** en el chat, mostrando: los commits propuestos en orden, los archivos
   de cada uno, su mensaje, y qué queda fuera del stage.
4. Hasta que el usuario conteste, no se commitea nada.

Si son varios commits, se hacen de uno en uno: `add` → confirmar → `commit` → `log -1` →
siguiente. No se arman todos los stages a la vez.

---

## Deny list

- `git commit` sin permiso explícito.
- `git push`, `git pull`, `git fetch`, `git sync`, `git remote set-url`.
- `git add .`, `git add -A`, `git commit -a`.
- Mensajes de varias líneas, en inglés, o con cualquier trailer.
- Commitear un archivo que no pasa `node --check`.
- Mezclar código y documentación en el mismo commit.

## Checklist de salida

- [ ] El usuario confirmó.
- [ ] Un commit por entrega; desarrollo y documentación separados.
- [ ] Cada archivo se agregó por su nombre.
- [ ] `git log -1 --format=%B` es una sola línea, sin trailers.
- [ ] `_git_msg.txt` borrado.
- [ ] **No se hizo push.**
