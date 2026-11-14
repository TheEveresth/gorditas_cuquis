const empleado = JSON.parse(localStorage.getItem("empleado"));

if (!empleado) {
  window.location.href = "index.html";
}

async function cargarMesas() {
  const { data, error } = await db
    .from("mesas")
    .select(`
      *,
      ordenes (
        id,
        total,
        estado
      )
    `)
    .eq("activa", true)
    .order("numero", { ascending: true });

  if (error) {
    console.error(error);
    alert("Error al cargar mesas");
    return;
  }

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
  const { data, error } = await db
    .from("mesas")
    .select("*")
    .eq("id", mesaId)
    .single();

  if (error) {
    console.error(error);
    alert("Error al seleccionar mesa");
    return;
  }

  localStorage.setItem("mesa", JSON.stringify(data));
  window.location.href = "cuentas.html";
}

cargarMesas();