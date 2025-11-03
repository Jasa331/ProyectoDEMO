// Mostrar una sección y ocultar las demás
function mostrarSeccion(id) {
  // Caso especial: cerrar sesión
  if (id === "cerrarSesion") {
    localStorage.clear();
    sessionStorage.clear();
    ocultarTodas();

    const cerrarDiv = document.getElementById("cerrarSesion");
    if (cerrarDiv) {
      cerrarDiv.style.display = "block";
      cerrarDiv.innerHTML = "<h1>Cerrando sesión...</h1><p>Redirigiendo al inicio...</p>";
    }

    setTimeout(() => {
      window.location.href = "../HTML/index_Inicio.html";
    }, 1000);
    return;
  }

  // Mostrar la sección seleccionada
  ocultarTodas();
  const seccion = document.getElementById(id);
  if (seccion) {
    seccion.style.display = "block";
  } else {
    console.warn(`⚠ La sección ${id} no existe en el HTML`);
  }
}

// Oculta todas las secciones
function ocultarTodas() {
  const secciones = document.querySelectorAll(".seccion");
  secciones.forEach(sec => sec.style.display = "none");
}

// Hacer accesible la función desde el HTML (onclick)
window.mostrarSeccion = mostrarSeccion;


// ==============================
// EVENTOS ESPECIALES
// ==============================

// Activar eventos por sección (opcional)
function activarEventos(id) {
  if (id === "reportes") {
    console.log("Mostrando reportes del empleado...");
  }
  if (id === "inventario") {
    console.log("Mostrando inventario del empleado...");
  }
}


// ==============================
// CONTROL DE SESIÓN
// ==============================

document.addEventListener("DOMContentLoaded", () => {
  // Si no hay sesión, redirigir al login
  const usuarioActivo = localStorage.getItem("usuarioActivo");
  if (!usuarioActivo) {
    alert("Debes iniciar sesión primero");
    window.location.href = "../HTML/index_login.html";
    return;
  }

  // Mostrar saludo con nombre (si está guardado)
  const datos = JSON.parse(usuarioActivo);
  const nombre = datos?.usuario || "Empleado";
  const saludo = document.createElement("div");
  saludo.className = "saludo-panel";
  saludo.textContent = `HOLA ${nombre.toUpperCase()}, bienvenido al panel de EMPLEADO.`;

  const content = document.querySelector(".content");
  if (content) content.prepend(saludo);

  // Mostrar la sección Dashboard por defecto
  mostrarSeccion("dashboard");
});


// ==============================
// CAMBIO DE TEMA (modo claro/oscuro)
// ==============================

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


// ==============================
// UTILIDAD EXTRA (formato de tiempo)
// ==============================

function formatearTiempo(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  return `${h}h ${m}m ${s}s`;
}
