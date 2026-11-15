async function cargarMesas() {
  const data = await datos.mesasActivasConOrdenes();

  if (!data) return;

  const contenedor = document.getElementById("mesas");
  contenedor.innerHTML = "";

  data.forEach(mesa => {
    const cuentasAbiertas = (mesa.ordenes || []).filter(o => o.estado === "abierta");

    const totalMesa = cuentasAbiertas.reduce((sum, orden) => {
      return sum + Number(orden.total || 0);
    }, 0);

    const card = document.createElement("article");
    card.classList.add("metric-card");

    card.innerHTML = `
      <span>Mesa</span>
      <strong>${mesa.numero}</strong>

      <p>
        ${cuentasAbiertas.length > 0
          ? `${cuentasAbiertas.length} cuenta(s) abierta(s)`
          : "Sin cuentas abiertas"}
      </p>

      <p>Total actual: <b>$${totalMesa.toFixed(2)}</b></p>

      <button class="btn-primary" onclick="seleccionarMesa('${mesa.id}')">
        Ver mesa
      </button>
    `;

    contenedor.appendChild(card);
  });
}

async function seleccionarMesa(mesaId) {
  const data = await datos.mesaPorId(mesaId);

  if (!data) return;

  localStorage.setItem("mesa", JSON.stringify(data));
  window.location.href = "cuentas.html";
}

cargarMesas();