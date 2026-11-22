// Cola de la cocina: una sola lista con las ordenes abiertas de mesa y para
// llevar, en orden de llegada. `pendiente` y `en_produccion` se pintan juntas
// en "Por preparar"; `listo` va aparte. Una orden ya `entregado` no aparece.

let ordenes = [];


const buscador = document.getElementById("buscadorPedidos");

if (buscador) {
  buscador.addEventListener("input", () => {
    pintarOrdenes();
  });
}

async function cargarOrdenes() {
  const data = await datos.ordenesAbiertasDeCocina();

  if (!data) return;

  ordenes = data;
  pintarOrdenes();
}

// "Mesa 3" o "Para llevar": es lo primero que busca el cocinero en la tarjeta.
function etiquetaOrigen(orden) {
  if (orden.tipo !== "local") {
    return "Para llevar";
  }

  return orden.mesas && orden.mesas.numero
    ? `Mesa ${orden.mesas.numero}`
    : "Mesa";
}

function pintarOrdenes() {
  const textoBusqueda = buscador ? buscador.value.trim().toLowerCase() : "";

  const filtradas = ordenes.filter((orden, index) => {
    const numero = String(index + 1);
    const nombre = (orden.nombre_cliente || orden.referencia || "").toLowerCase();
    const telefono = (orden.telefono_cliente || "").toLowerCase();
    const origen = etiquetaOrigen(orden).toLowerCase();

    return (
      numero.includes(textoBusqueda) ||
      nombre.includes(textoBusqueda) ||
      telefono.includes(textoBusqueda) ||
      origen.includes(textoBusqueda)
    );
  });

  const porPreparar = filtradas.filter(
    o => o.estado_preparacion === "pendiente" || o.estado_preparacion === "en_produccion"
  );

  const listos = filtradas.filter(
    o => o.estado_preparacion === "listo"
  );

  pintarGrupo("cocinaPorPreparar", porPreparar);
  pintarGrupo("cocinaListos", listos);
}

function pintarGrupo(contenedorId, lista) {
  const contenedor = document.getElementById(contenedorId);
  contenedor.innerHTML = "";

  if (lista.length === 0) {
    contenedor.innerHTML = "<p>No hay órdenes en esta sección.</p>";
    return;
  }

  lista.forEach(orden => {
    const total = (orden.orden_items || []).reduce((sum, item) => {
      return sum + Number(item.cantidad) * Number(item.precio_unitario);
    }, 0);

    const productos = (orden.orden_items || []).map(item => {
      const nombreProducto =
        item.nombre_personalizado ||
        item.productos?.nombre ||
        "Producto";

      return `${item.cantidad} x ${nombreProducto}`;
    }).join("<br>");

    const nombreOrden =
      orden.nombre_cliente ||
      orden.referencia ||
      "Sin referencia";

    const hora = orden.created_at
      ? new Date(orden.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })
      : "";

    const card = document.createElement("article");
    card.classList.add("metric-card");

    card.innerHTML = `
      <span>${etiquetaOrigen(orden)}</span>
      <strong>${nombreOrden}</strong>

      <p><b>Hora:</b> ${hora}</p>
      ${orden.telefono_cliente ? `<p><b>Tel:</b> ${orden.telefono_cliente}</p>` : ""}
      ${orden.excepciones ? `<p><b>Excepción:</b> ${orden.excepciones}</p>` : ""}
      ${orden.notas ? `<p><b>Notas:</b> ${orden.notas}</p>` : ""}

      <p>${productos || "Sin productos"}</p>

      <p>Total actual: <b>$${total.toFixed(2)}</b></p>

      <button class="btn-primary" onclick="abrirOrden('${orden.id}')">
        Editar / Cobrar
      </button>

      ${
        orden.estado_preparacion !== "listo"
          ? `<button class="btn-success" onclick="marcarListo('${orden.id}')">Marcar lista</button>`
          : ""
      }
    `;

    contenedor.appendChild(card);
  });
}

async function marcarListo(ordenId) {
  const listo = await datos.marcarOrdenLista(ordenId);

  if (!listo) return;

  await cargarOrdenes();
}

async function abrirOrden(ordenId) {
  const data = await datos.ordenPorId(ordenId, "Error al abrir la orden");

  if (!data) return;

  // El POS usa `mesa` solo para volver a la pantalla de cuentas. Una orden para
  // llevar no tiene, y dejar la de antes manda al empleado a otra mesa.
  if (data.tipo === "local" && data.mesa_id) {
    const mesa = await datos.mesaPorId(data.mesa_id);

    if (mesa) {
      localStorage.setItem("mesa", JSON.stringify(mesa));
    }
  } else {
    localStorage.removeItem("mesa");
  }

  localStorage.setItem("ordenActual", JSON.stringify(data));
  window.location.href = "pos.html";
}

cargarOrdenes();
