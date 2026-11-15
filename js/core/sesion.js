// Sesion del empleado. La cargan todas las pantallas menos index.html (el
// login): si no hay empleado guardado, regresa al login. Va despues de
// config.js y antes del script de la pantalla.
const empleado = JSON.parse(localStorage.getItem("empleado") || "null");

if (!empleado) {
  window.location.href = "index.html";
}

// La usan los botones "Cerrar sesion" de la barra superior.
function cerrarSesion() {
  localStorage.clear();
  window.location.href = "index.html";
}
