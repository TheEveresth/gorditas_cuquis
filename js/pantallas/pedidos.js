let pedidos = [];


const buscador = document.getElementById("buscadorPedidos");

if (buscador) {
  buscador.addEventListener("input", () => {
    pintarPedidos();
  });
}

async function cargarPedidos() {
  const data = await datos.pedidosParaLlevarAbiertos();

  if (!data) return;

  pedidos = data;
  pintarPedidos();
}

function pintarPedidos() {
  const textoBusqueda = buscador ? buscador.value.trim().toLowerCase() : "";

  const pedidosFiltrados = pedidos.filter((pedido, index) => {
    const numero = String(index + 1);
    const nombre = (pedido.nombre_cliente || pedido.referencia || "").toLowerCase();
    const telefono = (pedido.telefono_cliente || "").toLowerCase();

    return (
      numero.includes(textoBusqueda) ||
      nombre.includes(textoBusqueda) ||
      telefono.includes(textoBusqueda)
    );
  });

  const produccion = pedidosFiltrados.filter(
    p => p.estado_preparacion === "en_produccion"
  );

  const listos = pedidosFiltrados.filter(
    p => p.estado_preparacion === "listo"
  );

  pintarGrupo("pedidosProduccion", produccion);
  pintarGrupo("pedidosListos", listos);
}

function pintarGrupo(contenedorId, listaPedidos) {
  const contenedor = document.getElementById(contenedorId);
  contenedor.innerHTML = "";

  if (listaPedidos.length === 0) {
    contenedor.innerHTML = "<p>No hay pedidos en esta sección.</p>";
    return;
  }

  listaPedidos.forEach((pedido, index) => {
    const total = (pedido.orden_items || []).reduce((sum, item) => {
      return sum + Number(item.cantidad) * Number(item.precio_unitario);
    }, 0);

    const productos = (pedido.orden_items || []).map(item => {
      const nombreProducto =
        item.nombre_personalizado ||
        item.productos?.nombre ||
        "Producto";

      return `${item.cantidad} x ${nombreProducto}`;
    }).join("<br>");

    const nombrePedido =
      pedido.nombre_cliente ||
      pedido.referencia ||
      "Sin referencia";

    const hora = pedido.created_at
      ? new Date(pedido.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })
      : "";

    const card = document.createElement("article");
    card.classList.add("metric-card");

    card.innerHTML = `
      <span>Pedido</span>
      <strong>${nombrePedido}</strong>

      <p><b>Hora:</b> ${hora}</p>
      ${pedido.telefono_cliente ? `<p><b>Tel:</b> ${pedido.telefono_cliente}</p>` : ""}
      ${pedido.excepciones ? `<p><b>Excepción:</b> ${pedido.excepciones}</p>` : ""}
      ${pedido.notas ? `<p><b>Notas:</b> ${pedido.notas}</p>` : ""}

      <p>${productos || "Sin productos"}</p>

      <p>Total actual: <b>$${total.toFixed(2)}</b></p>

      <button class="btn-primary" onclick="abrirPedido('${pedido.id}')">
        Editar / Cobrar
      </button>

      ${
        pedido.estado_preparacion === "en_produccion"
          ? `<button class="btn-success" onclick="marcarListo('${pedido.id}')">Marcar listo</button>`
          : ""
      }
    `;

    contenedor.appendChild(card);
  });
}

async function marcarListo(ordenId) {
  const listo = await datos.marcarOrdenLista(ordenId);

  if (!listo) return;

  await cargarPedidos();
}

async function abrirPedido(ordenId) {
  const data = await datos.ordenPorId(ordenId, "Error al abrir pedido");

  if (!data) return;

  localStorage.removeItem("mesa");
  localStorage.setItem("ordenActual", JSON.stringify(data));
  window.location.href = "pos.html";
}

cargarPedidos();