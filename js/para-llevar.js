const empleado = JSON.parse(localStorage.getItem("empleado"));

if (!empleado) {
  window.location.href = "index.html";
}

async function crearPedidoParaLlevar() {
  const { data, error } = await db
    .from("ordenes")
    .insert([{
      mesa_id: null,
      empleado_id: empleado.id,
      tipo: "para_llevar",
      estado: "abierta",
      estado_preparacion: "en_produccion",
      subtotal: 0,
      descuento: 0,
      total: 0
    }])
    .select()
    .single();

  if (error) {
    console.error(error);
    alert("Error al crear pedido para llevar");
    return;
  }

  localStorage.removeItem("mesa");
  localStorage.setItem("ordenActual", JSON.stringify(data));

  window.location.href = "pos.html";
}