let productos = [];
let categorias = [];
let categoriaActual = "todos";

let paquetes = [];
let paqueteActivoId = null;

const empleado = JSON.parse(localStorage.getItem("empleado"));

if (!empleado) {
  window.location.href = "index.html";
}

document.getElementById("tipoPedido").addEventListener("change", cambiarTipoPedido);

// ==========================
// CARGAS INICIALES
// ==========================

async function cargarCategorias() {
  const { data, error } = await db
    .from("categorias")
    .select("*")
    .eq("activa", true)
    .order("nombre", { ascending: true });

  if (error) {
    console.error(error);
    alert("Error al cargar categorías");
    return;
  }

  categorias = data;
  mostrarCategorias();
}

async function cargarProductos() {
  const { data, error } = await db
    .from("productos")
    .select("*")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) {
    console.error(error);
    alert("Error al cargar productos");
    return;
  }

  productos = data;
  mostrarProductos();
}

async function cargarMesas() {
  const { data, error } = await db
    .from("mesas")
    .select("*")
    .eq("activa", true)
    .order("numero", { ascending: true });

  if (error) {
    console.error(error);
    alert("Error al cargar mesas");
    return;
  }

  const mesaSelect = document.getElementById("mesaSelect");
  mesaSelect.innerHTML = "";

  data.forEach(mesa => {
    const option = document.createElement("option");
    option.value = mesa.id;
    option.textContent = `Mesa ${mesa.numero}`;
    mesaSelect.appendChild(option);
  });
}

// ==========================
// CATEGORÍAS / PRODUCTOS
// ==========================

function mostrarCategorias() {
  const contenedor = document.getElementById("categorias");
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

function mostrarProductos() {
  const contenedor = document.getElementById("productos");
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

    btn.addEventListener("click", () => agregarAlPaqueteActivo(producto));

    contenedor.appendChild(btn);
  });
}

// ==========================
// PAQUETES
// ==========================

function crearPaquete() {
  const numero = paquetes.length + 1;

  const paquete = {
    idLocal: `paquete_${Date.now()}`,
    nombre: `Paquete ${numero}`,
    items: []
  };

  paquetes.push(paquete);
  paqueteActivoId = paquete.idLocal;

  mostrarPaquetes();
  mostrarCarrito();
}

function obtenerPaqueteActivo() {
  return paquetes.find(p => p.idLocal === paqueteActivoId);
}

function cambiarPaqueteActivo(idLocal) {
  paqueteActivoId = idLocal;
  mostrarPaquetes();
  mostrarCarrito();
}

function mostrarPaquetes() {
  const contenedor = document.getElementById("paquetesTabs");
  contenedor.innerHTML = "";

  paquetes.forEach(paquete => {
    const btn = document.createElement("button");
    btn.classList.add("btn-small");

    if (paquete.idLocal === paqueteActivoId) {
      btn.style.background = "var(--amarillo-ocre)";
      btn.style.fontWeight = "bold";
    }

    btn.innerText = paquete.nombre;
    btn.onclick = () => cambiarPaqueteActivo(paquete.idLocal);

    contenedor.appendChild(btn);
  });
}

// ==========================
// CARRITO POR PAQUETE
// ==========================

function agregarAlPaqueteActivo(producto) {
  const paquete = obtenerPaqueteActivo();

  if (!paquete) {
    alert("Primero crea un paquete");
    return;
  }

  const itemExistente = paquete.items.find(item => item.id === producto.id && !item.esRapido);

  if (itemExistente) {
    itemExistente.cantidad += 1;
    itemExistente.total = itemExistente.cantidad * itemExistente.precio_unitario;
  } else {
    paquete.items.push({
      id: producto.id,
      nombre: producto.nombre,
      cantidad: 1,
      precio_unitario: Number(producto.precio_venta),
      total: Number(producto.precio_venta),
      esRapido: false
    });
  }

  mostrarCarrito();
}

function mostrarCarrito() {
  const contenedor = document.getElementById("carrito");
  contenedor.innerHTML = "";

  if (paquetes.length === 0) {
    contenedor.innerHTML = "<p>No hay paquetes creados.</p>";
    calcularTotal();
    return;
  }

  paquetes.forEach(paquete => {
    const bloque = document.createElement("div");
    bloque.classList.add("carrito-item");

    const totalPaquete = paquete.items.reduce((sum, item) => sum + item.total, 0);

    let itemsHtml = "";

    if (paquete.items.length === 0) {
      itemsHtml = "<p>Sin productos.</p>";
    } else {
      itemsHtml = paquete.items.map(item => `
        <div class="carrito-item-header">
          <span>${item.nombre}</span>
          <span>$${item.total.toFixed(2)}</span>
        </div>

        <div class="carrito-controles">
          <button class="btn-small" onclick="restarProducto('${paquete.idLocal}', '${item.id}')">-</button>
          <strong>${item.cantidad}</strong>
          <button class="btn-small" onclick="sumarProducto('${paquete.idLocal}', '${item.id}')">+</button>
          <button class="btn-small" onclick="eliminarProducto('${paquete.idLocal}', '${item.id}')">Eliminar</button>
        </div>
      `).join("");
    }

    bloque.innerHTML = `
      <div class="carrito-item-header">
        <strong>${paquete.nombre}</strong>
        <strong>$${totalPaquete.toFixed(2)}</strong>
      </div>

      ${itemsHtml}
    `;

    contenedor.appendChild(bloque);
  });

  calcularTotal();
}

function sumarProducto(paqueteId, itemId) {
  const paquete = paquetes.find(p => p.idLocal === paqueteId);
  if (!paquete) return;

  const item = paquete.items.find(i => i.id === itemId);
  if (!item) return;

  item.cantidad += 1;
  item.total = item.cantidad * item.precio_unitario;

  mostrarCarrito();
}

function restarProducto(paqueteId, itemId) {
  const paquete = paquetes.find(p => p.idLocal === paqueteId);
  if (!paquete) return;

  const item = paquete.items.find(i => i.id === itemId);
  if (!item) return;

  item.cantidad -= 1;

  if (item.cantidad <= 0) {
    paquete.items = paquete.items.filter(i => i.id !== itemId);
  } else {
    item.total = item.cantidad * item.precio_unitario;
  }

  mostrarCarrito();
}

function eliminarProducto(paqueteId, itemId) {
  const paquete = paquetes.find(p => p.idLocal === paqueteId);
  if (!paquete) return;

  paquete.items = paquete.items.filter(i => i.id !== itemId);
  mostrarCarrito();
}

function vaciarCarrito() {
  paquetes = [];
  paqueteActivoId = null;
  crearPaquete();
}

// ==========================
// PRODUCTO RÁPIDO
// ==========================

function abrirProductoRapido() {
  document.getElementById("productoRapidoNombre").value = "";
  document.getElementById("productoRapidoPrecio").value = "";
  document.getElementById("modalProductoRapido").style.display = "grid";
}

function cerrarProductoRapido() {
  document.getElementById("modalProductoRapido").style.display = "none";
}

function agregarProductoRapido() {
  const paquete = obtenerPaqueteActivo();

  if (!paquete) {
    alert("Primero crea un paquete");
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

  paquete.items.push({
    id: `rapido_${Date.now()}`,
    producto_id: null,
    nombre,
    cantidad: 1,
    precio_unitario: precio,
    total: precio,
    esRapido: true
  });

  cerrarProductoRapido();
  mostrarCarrito();
}

// ==========================
// FORMULARIO
// ==========================

function cambiarTipoPedido() {
  const tipo = document.getElementById("tipoPedido").value;
  const grupoMesa = document.getElementById("grupoMesa");

  grupoMesa.style.display = tipo === "local" ? "block" : "none";
}

function calcularTotal() {
  const total = paquetes.reduce((sum, paquete) => {
    const totalPaquete = paquete.items.reduce((s, item) => s + item.total, 0);
    return sum + totalPaquete;
  }, 0);

  document.getElementById("total").innerText = total.toFixed(2);
  return total;
}

// ==========================
// GUARDAR ORDEN
// ==========================

async function guardarOrden() {
  const tieneProductos = paquetes.some(paquete => paquete.items.length > 0);

  if (!tieneProductos) {
    alert("Agrega al menos un producto");
    return;
  }

  const tipo = document.getElementById("tipoPedido").value;
  const nombreCliente = document.getElementById("nombreCliente").value.trim();
  const telefonoCliente = document.getElementById("telefonoCliente").value.trim();
  const excepciones = document.getElementById("excepciones").value.trim();
  const notas = document.getElementById("notas").value.trim();

  if (!nombreCliente) {
    alert("Ingresa el nombre del cliente");
    return;
  }

  const total = calcularTotal();

  let mesaId = null;
  let estadoPreparacion = "pendiente";

  if (tipo === "local") {
    mesaId = document.getElementById("mesaSelect").value;

    if (!mesaId) {
      alert("Selecciona una mesa");
      return;
    }

    estadoPreparacion = "pendiente";
  }

  if (tipo === "para_llevar") {
    estadoPreparacion = "en_produccion";
  }

  const { data: orden, error: errorOrden } = await db
    .from("ordenes")
    .insert([{
      mesa_id: mesaId,
      empleado_id: empleado.id,
      tipo,
      estado: "abierta",
      estado_preparacion: estadoPreparacion,
      referencia: nombreCliente,
      nombre_cliente: nombreCliente,
      telefono_cliente: telefonoCliente || null,
      excepciones: excepciones || null,
      notas: notas || null,
      subtotal: total,
      descuento: 0,
      total
    }])
    .select()
    .single();

  if (errorOrden) {
    console.error(errorOrden);
    alert("Error al guardar orden");
    return;
  }

  for (const paquete of paquetes) {
    if (paquete.items.length === 0) continue;

    const { data: paqueteGuardado, error: errorPaquete } = await db
      .from("orden_paquetes")
      .insert([{
        orden_id: orden.id,
        nombre: paquete.nombre
      }])
      .select()
      .single();

    if (errorPaquete) {
      console.error(errorPaquete);
      alert("La orden se creó, pero hubo error al guardar paquetes");
      return;
    }

    const items = paquete.items.map(item => ({
      orden_id: orden.id,
      paquete_id: paqueteGuardado.id,
      producto_id: item.esRapido ? null : item.id,
      nombre_personalizado: item.esRapido ? item.nombre : null,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario
    }));

    const { error: errorItems } = await db
      .from("orden_items")
      .insert(items);

    if (errorItems) {
      console.error(errorItems);
      alert("La orden se creó, pero hubo error al guardar productos");
      return;
    }
  }

  alert("Orden guardada correctamente");

  paquetes = [];
  paqueteActivoId = null;
  crearPaquete();

  if (tipo === "local") {
    const { data: mesaSeleccionada } = await db
      .from("mesas")
      .select("*")
      .eq("id", mesaId)
      .single();

    localStorage.setItem("mesa", JSON.stringify(mesaSeleccionada));
    window.location.href = "cuentas.html";
  } else {
    window.location.href = "pedidos.html";
  }
}

// ==========================
// INICIO
// ==========================

cargarCategorias();
cargarProductos();
cargarMesas();
cambiarTipoPedido();
crearPaquete();