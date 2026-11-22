# 011 — Tomar orden pierde la mesa de la que vienes

**Riesgo:** alto · **Estado:** cerrada el 2026-11-21 · Detectada el mismo día (probando la captura)

Al entrar por **Mesas → Mesa 3 → Tomar nueva orden**, `tomar-orden.html` abre el formulario
con **Tipo = "Para llevar"** y, al cambiarlo a "Local", el selector de mesa propone
**"Mesa 1"**. El `localStorage` sí trae la Mesa 3 correcta; la pantalla no la usa.

**Qué provoca:** si el empleado no se acuerda de cambiar las dos cosas, la orden se guarda
como pedido para llevar, o se guarda en la **mesa equivocada**, y no hay ningún aviso. En hora
pico es el error más fácil de cometer y el más caro: la cuenta le aparece a otra mesa.

Comprobado el 2026-11-21: entrando por la Mesa 3, el formulario mostraba Para llevar y
`mesaSelect` valía el id de la Mesa 1, con `localStorage.mesa` = Mesa 3.

## Cómo se cerró

- `cuentas.html`: el botón "Tomar nueva orden" ahora navega a `tomar-orden.html?origen=mesa`.
- `js/pantallas/tomar-orden.js`: `preseleccionarMesaDeContexto()`, llamada al final de
  `cargarMesas()` (necesita las opciones ya pintadas), pone `Tipo = Local` y la mesa guardada.

**Por qué el origen viaja en la URL y no solo en `localStorage`:** la mesa que se visitó hace
rato sigue guardada ahí, y nadie la limpia. Si la pantalla se fiara solo de eso, al entrar por
Dashboard → Tomar orden un pedido para llevar arrancaría propuesto como cuenta de una mesa, que
es el mismo error al revés. Con el parámetro, el contexto no puede quedar viejo: viaja con el
clic o no existe.

Verificado el 2026-11-21, por el camino real y con su contraprueba:

- Mesas → Mesa 3 → Tomar nueva orden: `Tipo = local`, selector en **Mesa 3**, grupo visible.
- Dashboard → Tomar orden, **con la Mesa 3 todavía guardada** en `localStorage`:
  `Tipo = para_llevar` y el grupo de mesa oculto. No se cuela.
