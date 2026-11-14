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

  const { data, error } = await db
    .from("empleados")
    .select("*")
    .eq("numero_empleado", numero)
    .eq("password_hash", password)
    .maybeSingle();

  if (error) {
    console.error("Error login:", error);
    alert("Error al conectar con la base de datos");
    return;
  }

  if (!data) {
    alert("Credenciales incorrectas");
    return;
  }

  localStorage.setItem("empleado", JSON.stringify(data));
  window.location.href = "dashboard.html";
}