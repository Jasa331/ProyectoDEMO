// ==============================
// FUNCIONES PRINCIPALES
// ==============================

// Mostrar una sección y ocultar las demás
function mostrarSeccion(id) {
  if (id === "cerrarSesion") {
    localStorage.clear();
    sessionStorage.clear();
    ocultarTodas();
    const cerrarDiv = document.getElementById("cerrarSesion");
    if (cerrarDiv) {
      cerrarDiv.classList.add("activa");
      cerrarDiv.innerHTML = "<h1>Cerrando sesión...</h1><p>Redirigiendo al inicio...</p>";
    }
    setTimeout(() => {
      window.location.href = "../HTML/index_Inicio.html";
    }, 1000);
    return;
  }

  ocultarTodas();

  const seccion = document.getElementById(id);
  if (seccion) {
    seccion.classList.add("activa");
  }
}

// Ocultar todas las secciones
function ocultarTodas() {
  const secciones = document.querySelectorAll(".seccion");
  secciones.forEach(sec => sec.classList.remove("activa"));
}

// Hacer accesible la función desde onclick
window.mostrarSeccion = mostrarSeccion;


// ==============================
// CONTROL DE SESIÓN
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const usuarioActivo = localStorage.getItem("usuarioActivo");
  if (!usuarioActivo) {
    alert("Debes iniciar sesión primero");
    window.location.href = "../HTML/index_login.html";
    return;
  }

  const datos = JSON.parse(usuarioActivo);
  const nombre = datos?.Usuario_Nombre || datos?.usuario || "Empleado";
  const saludo = document.createElement("div");
  saludo.className = "saludo-panel";
  saludo.textContent = `HOLA ${nombre.toUpperCase()}, bienvenido al panel de EMPLEADO.`;

  const content = document.querySelector(".content");
  if (content) content.prepend(saludo);

  mostrarSeccion("dashboard");
});

  

const btnFlotante2 = document.getElementById("btnFlotante2");
if (btnFlotante2) {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  btnFlotante2.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  });
}
