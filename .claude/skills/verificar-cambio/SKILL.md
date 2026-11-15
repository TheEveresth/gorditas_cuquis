---
name: verificar-cambio
description: >
  Cómo comprobar que un cambio del POS Gorditas Cuquis de verdad funciona
  antes de reportarlo: sintaxis, servidor local, vista previa en el navegador,
  esperar a que terminen las consultas, romper el caché, pruebas de solo
  lectura en la base, limpieza de los datos de prueba y qué decir de lo que no
  se pudo verificar. Usar antes de afirmar que algo quedó, al cerrar un
  arreglo, cuando el usuario diga "pruébalo", "revisa que funcione",
  "ya quedó?", "no se ve el cambio" o "verifícalo", y siempre que el reporte
  final vaya a incluir la palabra "funciona".
---

# Skill: verificar un cambio

## Regla de oro

No se dice que algo quedó sin haberlo visto quedar. Si no se pudo verificar, se dice **qué** no
se verificó y **por qué**; no se rellena con una suposición.

Tres niveles, de más barato a más caro. Se sube de nivel según lo que toca el cambio.

---

## Nivel 1 — Estático (siempre)

```bash
node --check js/pantallas/<pagina>.js      # cada script tocado
grep -rn 'styles.css\|js/config.js' *.html # rutas viejas tras mover archivos
grep -n 'console.log\|debugger' <archivo>  # restos de depuración
```

Si se partió o movió CSS, comparar que no se perdieron reglas:

```bash
grep -c '{' css/*.css
```

## Nivel 2 — En el navegador (si cambió algo que se ve o se hace clic)

1. Levantar el servidor en segundo plano, nunca con `&` a mano:
   `python -m http.server 5500` con el parámetro de ejecución en segundo plano de la herramienta.
2. Abrir `http://localhost:5500/<pagina>.html` en el panel del navegador.
3. **Esperar.** Las pantallas pintan después de varias consultas `await`. Una captura inmediata
   sale vacía y no quiere decir que esté roto: dar ~3 segundos o leer el árbol de la página
   cuando ya haya contenido.
4. Revisar la consola: un error de JavaScript invalida la prueba aunque la pantalla se vea bien.
5. Si el cambio no aparece, es el caché del navegador antes que el código: `?v=2` en la URL o en
   la etiqueta, y volver a cargar. Comprobar que la página servida es la nueva (buscar el texto
   que se agregó) **antes** de empezar a depurar otra cosa.
6. Si la pantalla necesita sesión o una orden, el `localStorage` se siembra con datos **reales**
   de la base (un id de empleado que exista). Un id inventado provoca un error de llave foránea
   que parece un bug del código y no lo es.
7. Al terminar: dejar el tamaño de la ventana como estaba y **detener el servidor**.

## Nivel 3 — En la base (si cambió el esquema, una política o una RPC)

Solo lectura, siempre (skill `supabase-cuquis`).

- Lo que se afirme de la base se comprueba con un `select`: que la política existe, que el
  `grant` existe, que la función no devuelve columnas de más, que el monto guardado es el
  esperado.
- Para probar que un permiso funciona para el navegador, se revisan política **y** `grant`; no
  basta con que la consulta funcione desde el MCP, que corre con otro rol.
- Las pruebas que escriben (dar de alta una orden para cobrarla) **las hace el usuario desde la
  app**, o las autoriza explícitamente. El agente observa el resultado con `select`.
- Si quedaron datos de prueba, se dice cuáles, se cuentan antes y después, y se acuerda cómo se
  borran. Esta base es la de producción.

---

## El reporte

Una tabla corta: qué se cambió, cómo se comprobó, qué se vio.

| Cambio | Cómo se verificó | Resultado |
|---|---|---|
| Botón Eliminar | `pos.html` en el navegador | la cuenta pasó de $92.00 a $42.00 |

Y después, explícito:

- Lo que **no** se verificó y por qué (no había datos, hace falta una orden abierta, lo tiene
  que correr el usuario).
- Los scripts SQL que quedaron **pendientes de ejecutar**.
- Los datos que quedaron en la base.

## No hacer

- "Debería funcionar", "ya quedó" o "listo" sin una comprobación detrás.
- Tomar una captura antes de que la pantalla termine de cargar y concluir que está roto.
- Explicar un bug con una teoría sin antes descartar el caché y los datos de prueba.
- Dejar el servidor corriendo, el `localStorage` sembrado o datos de prueba en la base sin
  decirlo.
