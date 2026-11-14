const empleado = JSON.parse(localStorage.getItem("empleado"));

if (!empleado) {
  window.location.href = "index.html";
}

document.getElementById("bienvenida").innerText = `Bienvenido, ${empleado.nombre}`;

async function cargarDashboard() {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();

  const { data: ordenes, error: errorOrdenes } = await db
    .from("ordenes")
    .select("total, created_at")
    .gte("created_at", inicio)
    .eq("estado", "cerrada");

  if (!errorOrdenes && ordenes) {
    const total = ordenes.reduce((sum, orden) => sum + Number(orden.total || 0), 0);

    document.getElementById("ventasHoy").innerText = `$${total.toFixed(2)}`;
    document.getElementById("ordenesHoy").innerText = ordenes.length;
  }

  const { data: mesas, error: errorMesas } = await db
    .from("mesas")
    .select("id")
    .eq("activa", true);

  if (!errorMesas && mesas) {
    document.getElementById("mesasActivas").innerText = mesas.length;
  }
}

function cerrarSesion() {
  localStorage.clear();
  window.location.href = "index.html";
}

cargarDashboard();