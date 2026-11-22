document.getElementById("bienvenida").innerText = `Bienvenido, ${empleado.nombre}`;

async function cargarDashboard() {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();

  // Lo cobrado hoy sale de los pagos, no de las ordenes: una cuenta que se abre
  // un dia y se cobra al siguiente no caia en las ventas de ninguno de los dos.
  const pagos = await datos.pagosDesde(inicio);

  if (pagos) {
    const total = pagos.reduce((sum, pago) => sum + Number(pago.monto || 0), 0);

    // Varios cobros parciales de la misma cuenta son UNA orden del dia.
    const cuentas = new Set(pagos.map(pago => pago.orden_id));

    document.getElementById("ventasHoy").innerText = `$${total.toFixed(2)}`;
    document.getElementById("ordenesHoy").innerText = cuentas.size;
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