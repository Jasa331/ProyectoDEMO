let inicioTiempo = null;
let intervalo = null;

function mostrarSeccion(id) {
  // 👉 Si es cerrar sesión
  if (id === 'cerrarSesion') {
    localStorage.clear();
    sessionStorage.clear();

    const cerrarDiv = document.getElementById("cerrarSesion");
    ocultarTodas();
    if (cerrarDiv) {
      cerrarDiv.style.display = "block";
      cerrarDiv.innerHTML =
        "<h1>Cerrando sesión...</h1><p>Redirigiendo al inicio</p>";
    }

    setTimeout(() => {
      window.location.href = '../HTML/index_Inicio.html';
    }, 1200);
    return;
  }

  // 👉 Mostrar la sección correspondiente y ocultar las demás
  ocultarTodas();
  const seccion = document.getElementById(id);
  if (seccion) {
    seccion.style.display = "block";
    activarEventos(id);
  } else {
    console.warn(`⚠ La sección ${id} no existe en el HTML`);
  }
}

// Ocultar todas las secciones
function ocultarTodas() {
  const secciones = document.querySelectorAll(".seccion");
  secciones.forEach(sec => sec.style.display = "none");
}

// Hacer la función accesible desde onclick
window.mostrarSeccion = mostrarSeccion;

// ====== Activar eventos extra según la sección ======
function activarEventos(id) {
  const detalle = document.getElementById('detalleAgricultor');

  if (id === "reportes") {
    document.querySelectorAll('.btn-reportes').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const fila = btn.closest('tr');
        if (!fila) return;
        if (detalle) {
          detalle.innerHTML = `<h3>Reportes de ${fila.dataset.nombre}</h3>
                               <p>${fila.dataset.reportes}</p>`;
        }
      });
    });
  }

  if (id === "inventario") {
    document.querySelectorAll('.btn-inventario').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const fila = btn.closest('tr');
        if (!fila) return;
        if (detalle) {
          detalle.innerHTML = `<h3>Inventario de ${fila.dataset.nombre}</h3>
                               <p>${fila.dataset.inventario}</p>`;
        }
      });
    });
  }
}

// ====== Control de sesión ======
document.addEventListener("DOMContentLoaded", () => {
  // 🚨 Si no hay usuario logueado, redirigir al login
  const usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo") || "null");
  if (!usuarioActivo) {
    alert("Debes iniciar sesión primero");
    window.location.href = "../HTML/index_login.html";
    return;
  }

  // Mostrar dashboard por defecto
  mostrarSeccion('dashboard');
});

// ====== Utilidad para formatear tiempo ======
function formatearTiempo(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  return `${h}h ${m}m ${s}s`;
}

const btnFlotante = document.getElementById("btnFlotante");
const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);

btnFlotante.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
});