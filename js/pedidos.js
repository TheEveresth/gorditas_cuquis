const empleado = JSON.parse(localStorage.getItem("empleado"));

let pedidos = [];

if (!empleado) {
  window.location.href = "index.html";
}

const buscador = document.getElementById("buscadorPedidos");

if (buscador) {
  buscador.addEventListener("input", () => {
    pintarPedidos();
  });
}

async function cargarPedidos() {
  const { data, error } = await db
    .from("ordenes")
    .select(`
      *,
      orden_items (
        cantidad,
        precio_unitario,
        nombre_personalizado,
        productos (
          nombre
        )
      )
    `)
    .eq("tipo", "para_llevar")
    .eq("estado", "abierta")
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    alert("Error al cargar pedidos");
    return;
  }

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
  const { error } = await db
    .from("ordenes")
    .update({ estado_preparacion: "listo" })
    .eq("id", ordenId);

  if (error) {
    console.error(error);
    alert("Error al marcar pedido como listo");
    return;
  }

  await cargarPedidos();
}

async function abrirPedido(ordenId) {
  const { data, error } = await db
    .from("ordenes")
    .select("*")
    .eq("id", ordenId)
    .single();

  if (error) {
    console.error(error);
    alert("Error al abrir pedido");
    return;
  }

  localStorage.removeItem("mesa");
  localStorage.setItem("ordenActual", JSON.stringify(data));
  window.location.href = "pos.html";
}

cargarPedidos();