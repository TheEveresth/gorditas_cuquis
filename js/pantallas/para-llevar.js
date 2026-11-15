async function crearPedidoParaLlevar() {
  const data = await datos.crearOrden({
    mesa_id: null,
    empleado_id: empleado.id,
    tipo: "para_llevar",
    estado: "abierta",
    estado_preparacion: "en_produccion",
    subtotal: 0,
    descuento: 0,
    total: 0
  }, "Error al crear pedido para llevar");

  if (!data) return;

  localStorage.removeItem("mesa");
  localStorage.setItem("ordenActual", JSON.stringify(data));

  window.location.href = "pos.html";
}