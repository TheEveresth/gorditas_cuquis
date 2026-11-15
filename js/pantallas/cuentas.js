const mesa = JSON.parse(localStorage.getItem("mesa"));

let cuentas = [];


if (!mesa) {
  window.location.href = "mesas.html";
}

document.getElementById("tituloMesa").innerText = `Mesa ${mesa.numero}`;
document.getElementById("nombreMesa").innerText = `Mesa ${mesa.numero}`;

const buscador = document.getElementById("buscadorCuentas");

if (buscador) {
  buscador.addEventListener("input", () => {
    pintarCuentas();
  });
}

async function cargarCuentas() {
  const data = await datos.cuentasAbiertasDeMesa(mesa.id);

  if (!data) return;

  cuentas = data;
  pintarCuentas();
}

function pintarCuentas() {
  const contenedor = document.getElementById("cuentas");
  const textoBusqueda = buscador ? buscador.value.trim().toLowerCase() : "";

  contenedor.innerHTML = "";

  const cuentasFiltradas = cuentas.filter((orden, index) => {
    const numeroOrden = String(index + 1);
    const nombre = (orden.nombre_cliente || orden.referencia || "").toLowerCase();

    return (
      numeroOrden.includes(textoBusqueda) ||
      nombre.includes(textoBusqueda)
    );
  });

  if (cuentasFiltradas.length === 0) {
    contenedor.innerHTML = "<p>No hay cuentas que coincidan con la búsqueda.</p>";
    return;
  }

  cuentasFiltradas.forEach((orden, index) => {
    const totalReal = (orden.orden_items || []).reduce((sum, item) => {
      return sum + Number(item.cantidad) * Number(item.precio_unitario);
    }, 0);

    const nombreCliente =
      orden.nombre_cliente ||
      orden.referencia ||
      "Cliente sin nombre";

    const card = document.createElement("article");
    card.classList.add("metric-card");

    card.innerHTML = `
      <span>Orden ${index + 1}</span>
      <strong>${nombreCliente}</strong>

      <p>Total actual: <b>$${totalReal.toFixed(2)}</b></p>

      ${
        orden.notas
          ? `<p><b>Notas:</b> ${orden.notas}</p>`
          : ""
      }

      <button class="btn-primary" onclick="abrirCuenta('${orden.id}')">
        Editar / Cobrar
      </button>
    `;

    contenedor.appendChild(card);
  });
}

async function crearCuenta() {
  const data = await datos.crearOrden({
    mesa_id: mesa.id,
    empleado_id: empleado.id,
    tipo: "local",
    estado: "abierta",
    estado_preparacion: "pendiente",
    subtotal: 0,
    descuento: 0,
    total: 0
  }, "Error al crear cuenta");

  if (!data) return;

  localStorage.setItem("ordenActual", JSON.stringify(data));
  window.location.href = "pos.html";
}

async function abrirCuenta(ordenId) {
  const data = await datos.ordenPorId(ordenId, "Error al abrir cuenta");

  if (!data) return;

  localStorage.setItem("ordenActual", JSON.stringify(data));
  window.location.href = "pos.html";
}

cargarCuentas();