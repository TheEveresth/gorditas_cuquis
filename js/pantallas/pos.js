// ==========================
// VARIABLES GLOBALES
// ==========================

let productos = [];
let categorias = [];
let categoriaActual = "todos";

let orden = null;
let paquetes = [];
let paqueteActivoId = null;

const mesa = JSON.parse(localStorage.getItem("mesa"));
const ordenActual = JSON.parse(localStorage.getItem("ordenActual"));


if (!ordenActual || !ordenActual.id) {
  alert("No hay una orden activa");
  window.location.href = "dashboard.html";
}


// ==========================
// EVENTOS INICIALES
// ==========================

const recibidoInput = document.getElementById("recibido");

if (recibidoInput) {
  recibidoInput.addEventListener("input", calcularCambio);
}


// ==========================
// CARGAR DATOS DE LA ORDEN
// ==========================

async function cargarOrden() {
  const data = await datos.ordenPorId(ordenActual.id);

  if (!data) return;

  orden = data;
  mostrarDatosCliente();
}

function mostrarDatosCliente() {
  const infoPedido = document.getElementById("infoPedido");
  const infoCliente = document.getElementById("infoCliente");
  const infoTelefono = document.getElementById("infoTelefono");
  const infoExcepciones = document.getElementById("infoExcepciones");
  const infoNotas = document.getElementById("infoNotas");

  if (infoPedido) {
    infoPedido.innerText =
      orden.tipo === "para_llevar"
        ? `Pedido para llevar: ${orden.nombre_cliente || orden.referencia || "Sin nombre"}`
        : `Cuenta local: ${orden.nombre_cliente || orden.referencia || "Sin nombre"}`;
  }

  if (infoCliente) {
    infoCliente.innerText = orden.nombre_cliente
      ? `Cliente: ${orden.nombre_cliente}`
      : "";
  }

  if (infoTelefono) {
    infoTelefono.innerText = orden.telefono_cliente
      ? `Teléfono: ${orden.telefono_cliente}`
      : "";
  }

  if (infoExcepciones) {
    infoExcepciones.innerText = orden.excepciones
      ? `Excepciones: ${orden.excepciones}`
      : "";
  }

  if (infoNotas) {
    infoNotas.innerText = orden.notas
      ? `Notas: ${orden.notas}`
      : "";
  }
}


// ==========================
// CATEGORÍAS
// ==========================

async function cargarCategorias() {
  const data = await datos.categoriasActivas();

  if (!data) return;

  categorias = data;
  mostrarCategorias();
}

function mostrarCategorias() {
  const contenedor = document.getElementById("categorias");

  if (!contenedor) return;

  contenedor.innerHTML = "";

  const btnTodos = document.createElement("button");
  btnTodos.classList.add("btn-small");
  btnTodos.innerText = "Todos";

  btnTodos.onclick = () => {
    categoriaActual = "todos";
    mostrarProductos();
  };

  contenedor.appendChild(btnTodos);

  categorias.forEach(cat => {
    const btn = document.createElement("button");
    btn.classList.add("btn-small");
    btn.innerText = cat.nombre;

    btn.onclick = () => {
      categoriaActual = cat.id;
      mostrarProductos();
    };

    contenedor.appendChild(btn);
  });
}


// ==========================
// PRODUCTOS
// ==========================

async function cargarProductos() {
  const data = await datos.productosActivos();

  if (!data) return;

  productos = data;
  mostrarProductos();
}

function mostrarProductos() {
  const contenedor = document.getElementById("productos");

  if (!contenedor) return;

  contenedor.innerHTML = "";

  const productosFiltrados = productos.filter(producto => {
    if (categoriaActual === "todos") return true;
    return producto.categoria_id === categoriaActual;
  });

  if (productosFiltrados.length === 0) {
    contenedor.innerHTML = "<p>No hay productos en esta categoría.</p>";
    return;
  }

  productosFiltrados.forEach(producto => {
    const btn = document.createElement("button");
    btn.classList.add("producto-btn");

    btn.innerHTML = `
      <strong>${producto.nombre}</strong>
      <span>$${Number(producto.precio_venta).toFixed(2)}</span>
    `;

    btn.addEventListener("click", () => {
      agregarProductoAOrden(producto);
    });

    contenedor.appendChild(btn);
  });
}


// ==========================
// PAQUETES
// ==========================

async function cargarPaquetes() {
  const data = await datos.paquetesDeOrden(ordenActual.id);

  if (!data) return;

  paquetes = data.map(paquete => ({
    id: paquete.id,
    nombre: paquete.nombre,
    items: (paquete.orden_items || []).map(item => ({
      item_id: item.id,
      producto_id: item.producto_id,
      id: item.producto_id || item.id,
      nombre: item.nombre_personalizado || item.productos?.nombre || "Producto",
      cantidad: Number(item.cantidad),
      precio_unitario: Number(item.precio_unitario),
      total: Number(item.cantidad) * Number(item.precio_unitario),
      pagado: item.pagado || false,
      seleccionado: !item.pagado
    }))
  }));

  if (paquetes.length === 0) {
    await crearPaquete();
    return;
  }

  if (!paqueteActivoId) {
    paqueteActivoId = paquetes[0].id;
  }

  mostrarPaquetes();
  mostrarCarrito();
  await actualizarTotalOrden();
}

async function crearPaquete() {
  const numero = paquetes.length + 1;

  const data = await datos.crearPaquete(ordenActual.id, `Paquete ${numero}`);

  if (!data) return;

  paquetes.push({
    id: data.id,
    nombre: data.nombre,
    items: []
  });

  paqueteActivoId = data.id;

  mostrarPaquetes();
  mostrarCarrito();
}

function obtenerPaqueteActivo() {
  return paquetes.find(paquete => paquete.id === paqueteActivoId);
}

function cambiarPaqueteActivo(paqueteId) {
  paqueteActivoId = paqueteId;
  mostrarPaquetes();
  mostrarCarrito();
}

function mostrarPaquetes() {
  const contenedor = document.getElementById("paquetesTabs");

  if (!contenedor) return;

  contenedor.innerHTML = "";

  paquetes.forEach(paquete => {
    const btn = document.createElement("button");
    btn.classList.add("btn-small");

    if (paquete.id === paqueteActivoId) {
      btn.style.background = "var(--amarillo-ocre)";
      btn.style.fontWeight = "bold";
    }

    btn.innerText = paquete.nombre;

    btn.onclick = () => {
      cambiarPaqueteActivo(paquete.id);
    };

    contenedor.appendChild(btn);
  });
}


// ==========================
// AGREGAR PRODUCTOS A LA ORDEN
// ==========================

async function agregarProductoAOrden(producto) {
  const paquete = obtenerPaqueteActivo();

  if (!paquete) {
    alert("Primero crea o selecciona un paquete");
    return;
  }

  const itemExistente = paquete.items.find(item => {
    return item.producto_id === producto.id && !item.pagado;
  });

  if (itemExistente) {
    const sumado = await datos.cambiarCantidadItem(
      itemExistente.item_id,
      itemExistente.cantidad + 1
    );

    if (!sumado) return;
  } else {
    const agregado = await datos.agregarItem({
      orden_id: ordenActual.id,
      paquete_id: paquete.id,
      producto_id: producto.id,
      nombre_personalizado: null,
      cantidad: 1,
      precio_unitario: Number(producto.precio_venta),
      pagado: false
    });

    if (!agregado) return;
  }

  await cargarPaquetes();
}


// ==========================
// PRODUCTO RÁPIDO
// ==========================

function abrirProductoRapido() {
  const modal = document.getElementById("modalProductoRapido");

  document.getElementById("productoRapidoNombre").value = "";
  document.getElementById("productoRapidoPrecio").value = "";

  if (modal) {
    modal.style.display = "grid";
  }
}

function cerrarProductoRapido() {
  const modal = document.getElementById("modalProductoRapido");

  if (modal) {
    modal.style.display = "none";
  }
}

async function agregarProductoRapido() {
  const paquete = obtenerPaqueteActivo();

  if (!paquete) {
    alert("Primero crea o selecciona un paquete");
    return;
  }

  const nombre = document.getElementById("productoRapidoNombre").value.trim();
  const precio = Number(document.getElementById("productoRapidoPrecio").value);

  if (!nombre) {
    alert("Escribe el nombre del producto");
    return;
  }

  if (!precio || precio <= 0) {
    alert("Ingresa un precio válido");
    return;
  }

  const agregado = await datos.agregarItem({
    orden_id: ordenActual.id,
    paquete_id: paquete.id,
    producto_id: null,
    nombre_personalizado: nombre,
    cantidad: 1,
    precio_unitario: precio,
    pagado: false
  }, "Error al agregar producto rápido");

  if (!agregado) return;

  cerrarProductoRapido();
  await cargarPaquetes();
}


// ==========================
// MOSTRAR CARRITO / PAQUETES
// ==========================

function mostrarCarrito() {
  const contenedor = document.getElementById("carrito");

  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (paquetes.length === 0) {
    contenedor.innerHTML = "<p>No hay paquetes en esta cuenta.</p>";
    calcularTotales();
    return;
  }

  paquetes.forEach(paquete => {
    const bloque = document.createElement("div");
    bloque.classList.add("paquete-box");

    const totalPaquete = paquete.items.reduce((sum, item) => {
      return sum + Number(item.total || 0);
    }, 0);

    let itemsHtml = "";

    if (paquete.items.length === 0) {
      itemsHtml = "<p>Sin productos.</p>";
    } else {
      itemsHtml = paquete.items.map(item => `
        <div class="item-pago ${item.pagado ? "pagado" : ""}">
          <input
            type="checkbox"
            ${item.seleccionado ? "checked" : ""}
            ${item.pagado ? "disabled" : ""}
            onchange="toggleSeleccion('${paquete.id}', '${item.item_id}')"
          >

          <span>
            ${item.cantidad} x ${item.nombre}
            ${item.pagado ? "<small>(Pagado)</small>" : ""}
          </span>

          <strong>$${item.total.toFixed(2)}</strong>

          <div class="carrito-controles">
            <button class="btn-small" ${item.pagado ? "disabled" : ""} onclick="restarProducto('${paquete.id}', '${item.item_id}')">-</button>
            <button class="btn-small" ${item.pagado ? "disabled" : ""} onclick="sumarProducto('${paquete.id}', '${item.item_id}')">+</button>
            <button class="btn-small" ${item.pagado ? "disabled" : ""} onclick="eliminarProducto('${paquete.id}', '${item.item_id}')">Eliminar</button>
          </div>
        </div>
      `).join("");
    }

    bloque.innerHTML = `
      <div class="paquete-title">
        <span>${paquete.nombre}</span>
        <span>$${totalPaquete.toFixed(2)}</span>
      </div>

      ${itemsHtml}
    `;

    contenedor.appendChild(bloque);
  });

  calcularTotales();
}


// ==========================
// SUMAR / RESTAR / ELIMINAR PRODUCTOS
// ==========================

async function sumarProducto(paqueteId, itemId) {
  const item = buscarItem(paqueteId, itemId);

  if (!item || item.pagado) return;

  const sumado = await datos.cambiarCantidadItem(
    item.item_id,
    item.cantidad + 1,
    "Error al sumar producto"
  );

  if (!sumado) return;

  await cargarPaquetes();
}

async function restarProducto(paqueteId, itemId) {
  const item = buscarItem(paqueteId, itemId);

  if (!item || item.pagado) return;

  if (item.cantidad <= 1) {
    await eliminarProducto(paqueteId, itemId);
    return;
  }

  const restado = await datos.cambiarCantidadItem(
    item.item_id,
    item.cantidad - 1,
    "Error al restar producto"
  );

  if (!restado) return;

  await cargarPaquetes();
}

async function eliminarProducto(paqueteId, itemId) {
  const item = buscarItem(paqueteId, itemId);

  if (!item || item.pagado) return;

  const confirmar = confirm("¿Eliminar este producto de la cuenta?");
  if (!confirmar) return;

  const eliminado = await datos.eliminarItem(item.item_id);

  if (!eliminado) return;

  await cargarPaquetes();
}

function buscarItem(paqueteId, itemId) {
  const paquete = paquetes.find(p => p.id === paqueteId);
  if (!paquete) return null;

  return paquete.items.find(item => item.item_id === itemId);
}


// ==========================
// SELECCIÓN PARA COBRO PARCIAL
// ==========================

function toggleSeleccion(paqueteId, itemId) {
  const item = buscarItem(paqueteId, itemId);

  if (!item || item.pagado) return;

  item.seleccionado = !item.seleccionado;
  calcularTotales();
}

function seleccionarTodoPendiente() {
  paquetes.forEach(paquete => {
    paquete.items.forEach(item => {
      if (!item.pagado) {
        item.seleccionado = true;
      }
    });
  });

  mostrarCarrito();
}

function desmarcarTodo() {
  paquetes.forEach(paquete => {
    paquete.items.forEach(item => {
      item.seleccionado = false;
    });
  });

  mostrarCarrito();
}


// ==========================
// TOTALES
// ==========================

function calcularTotales() {
  const totalCuenta = paquetes.reduce((sum, paquete) => {
    return sum + paquete.items.reduce((s, item) => s + Number(item.total || 0), 0);
  }, 0);

  const totalSeleccionado = paquetes.reduce((sum, paquete) => {
    return sum + paquete.items
      .filter(item => item.seleccionado && !item.pagado)
      .reduce((s, item) => s + Number(item.total || 0), 0);
  }, 0);

  const totalCuentaEl = document.getElementById("total");
  const totalSeleccionadoEl = document.getElementById("totalSeleccionado");

  if (totalCuentaEl) {
    totalCuentaEl.innerText = totalCuenta.toFixed(2);
  }

  if (totalSeleccionadoEl) {
    totalSeleccionadoEl.innerText = totalSeleccionado.toFixed(2);
  }

  calcularCambio();

  return {
    totalCuenta,
    totalSeleccionado
  };
}

async function actualizarTotalOrden() {
  const { totalCuenta } = calcularTotales();

  await datos.actualizarTotalesOrden(ordenActual.id, totalCuenta, totalCuenta);
}

function calcularCambio() {
  const totalSeleccionado = paquetes.reduce((sum, paquete) => {
    return sum + paquete.items
      .filter(item => item.seleccionado && !item.pagado)
      .reduce((s, item) => s + Number(item.total || 0), 0);
  }, 0);

  const recibido = Number(document.getElementById("recibido")?.value) || 0;
  const cambio = recibido - totalSeleccionado;

  const cambioEl = document.getElementById("cambio");

  if (cambioEl) {
    cambioEl.innerText = cambio >= 0 ? cambio.toFixed(2) : "0.00";
  }
}


// ==========================
// COBRAR / GUARDAR PAGO
// ==========================

async function guardarVenta() {
  const itemsSeleccionados = paquetes.flatMap(paquete => {
    return paquete.items.filter(item => item.seleccionado && !item.pagado);
  });

  if (itemsSeleccionados.length === 0) {
    alert("Selecciona al menos un producto para cobrar");
    return;
  }

  const metodo = document.getElementById("metodoPago").value;
  const recibido = Number(document.getElementById("recibido").value) || 0;

  const totalSeleccionado = itemsSeleccionados.reduce((sum, item) => {
    return sum + Number(item.total || 0);
  }, 0);

  if (metodo === "efectivo" && recibido < totalSeleccionado) {
    alert("El dinero recibido es insuficiente");
    return;
  }

  const idsSeleccionados = itemsSeleccionados.map(item => item.item_id);

  // El cobro completo (registrar el pago, marcar los renglones y cerrar la
  // cuenta si ya no queda nada) ocurre en una sola transaccion en la base.
  // El monto lo calcula la base a partir de los renglones, no este navegador.
  const resultado = await datos.cobrarItems(
    ordenActual.id,
    idsSeleccionados,
    metodo,
    empleado.id
  );

  if (!resultado) {
    await cargarPaquetes();
    return;
  }

  await cargarPaquetes();

  if (resultado?.cerrada) {
    localStorage.removeItem("ordenActual");

    alert("Cuenta cobrada completamente");

    if (mesa) {
      window.location.href = "cuentas.html";
    } else {
      window.location.href = "pedidos.html";
    }

    return;
  }

  document.getElementById("recibido").value = "";
  document.getElementById("cambio").innerText = "0.00";

  alert("Pago parcial registrado. Quedan productos pendientes.");
}


// ==========================
// MINIMIZAR / MOSTRAR PRODUCTOS
// ==========================

function toggleProductos() {
  const layout = document.querySelector(".pos-layout");

  if (!layout) return;

  // La clase va en el layout porque es el grid quien define el ancho
  // de las dos columnas.
  layout.classList.toggle("productos-ocultos");
}


// ==========================
// NAVEGACIÓN
// ==========================

function volverACuentas() {
  localStorage.removeItem("ordenActual");

  if (mesa) {
    window.location.href = "cuentas.html";
  } else {
    window.location.href = "pedidos.html";
  }
}


// ==========================
// INICIO
// ==========================

async function iniciarPOS() {
  await cargarOrden();
  await cargarCategorias();
  await cargarProductos();
  await cargarPaquetes();
}

iniciarPOS();