// 📌 Variables globales
let inicioTiempo = null;
let intervalo = null;

// ====== Función principal para mostrar secciones ======
function mostrarSeccion(id) {
  // 👉 Si es cerrar sesión
  if (id === 'cerrarSesion') {
    localStorage.clear();
    sessionStorage.clear();

    document.getElementById("contenidoPrincipal").innerHTML =
      "<h1>Cerrando sesión...</h1><p>Redirigiendo al inicio</p>";

    setTimeout(() => {
      window.location.href = '../HTML/index_Inicio.html'; 
    }, 1200);
    return;
  }

  // 👉 Cargar sección desde archivo HTML en carpeta "secciones"
  fetch(`secciones/${id}.html`)
    .then(res => res.text())
    .then(html => {
      document.getElementById("contenidoPrincipal").innerHTML = html;

      // ⚡ Reasignar eventos especiales después de cargar la sección
      activarEventos(id);
    })
    .catch(err => {
      document.getElementById("contenidoPrincipal").innerHTML =
        `<p style="color:red;">⚠ Error al cargar la sección: ${id}</p>`;
      console.error(err);
    });
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

  // ✅ Botón de cerrar sesión
  const btnCerrarSesion = document.getElementById("btnCerrarSesion");
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", (e) => {
      e.preventDefault();
      mostrarSeccion("cerrarSesion");
    });
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
