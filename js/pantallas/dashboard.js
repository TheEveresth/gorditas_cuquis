document.getElementById("bienvenida").innerText = `Bienvenido, ${empleado.nombre}`;

async function cargarDashboard() {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();

  const ordenes = await datos.ordenesCerradasDesde(inicio);

  if (ordenes) {
    const total = ordenes.reduce((sum, orden) => sum + Number(orden.total || 0), 0);

    document.getElementById("ventasHoy").innerText = `$${total.toFixed(2)}`;
    document.getElementById("ordenesHoy").innerText = ordenes.length;
  }

  // "Mesas activas" = mesas que ahora mismo tienen cuenta abierta,
  // no todas las mesas dadas de alta.
  const ordenesAbiertas = await datos.ordenesLocalesAbiertas();

  if (ordenesAbiertas) {
    const mesasConCuenta = new Set(ordenesAbiertas.map(o => o.mesa_id));
    document.getElementById("mesasActivas").innerText = mesasConCuenta.size;
  }
}


cargarDashboard();