const btnLogin = document.getElementById("btnLogin");
const inputNumero = document.getElementById("numero");
const inputPassword = document.getElementById("password");

if (btnLogin) {
  btnLogin.addEventListener("click", login);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    login();
  }
});

async function login() {
  const numero = inputNumero.value.trim();
  const password = inputPassword.value.trim();

  if (!numero || !password) {
    alert("Ingresa número de empleado y contraseña");
    return;
  }

  // La contraseña se verifica dentro de la base de datos (bcrypt).
  // La tabla empleados ya no se consulta desde el navegador.
  const empleado = await datos.login(numero, password);

  // undefined = la base no respondio y datos.js ya aviso.
  if (empleado === undefined) {
    return;
  }

  if (!empleado) {
    alert("Credenciales incorrectas");
    return;
  }

  localStorage.setItem("empleado", JSON.stringify(empleado));
  window.location.href = "dashboard.html";
}
