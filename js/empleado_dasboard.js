// Función principal para mostrar secciones
function mostrarSeccion(id) {
  // Si es cerrar sesión
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

  // Cargar sección desde archivo HTML en carpeta "secciones"
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

// Cuando cargue el DOM
document.addEventListener("DOMContentLoaded", () => {
  mostrarSeccion('dashboard'); // Mostrar dashboard por defecto
});

// Eventos extra según sección
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

// 📌 Variables globales
let inicioTiempo = null;
let intervalo = null;

// Mostrar/Ocultar secciones
function mostrarSeccion(id) {
  const secciones = document.querySelectorAll(".seccion");
  secciones.forEach(sec => sec.style.display = "none");

  const activa = document.getElementById(id);
  if (activa) activa.style.display = "block";
}

document.addEventListener("DOMContentLoaded", () => {
  const btnIniciar = document.getElementById("btniniciarjornada");
  const content = document.querySelector(".content");

  if (btnIniciar) {
    btnIniciar.addEventListener("click", (e) => {
      e.preventDefault();

      // Si ya está en jornada, no vuelve a iniciar
      if (inicioTiempo) {
        alert("⚠ Ya tienes una jornada en curso.");
        return;
      }

      inicioTiempo = new Date();

      // Crear notificación con tiempo
      const noti = document.createElement("div");
      noti.id = "notificacionJornada";
      noti.style.padding = "15px";
      noti.style.marginTop = "20px";
      noti.style.background = "#e8f5e9";
      noti.style.border = "1px solid #4caf50";
      noti.style.borderRadius = "8px";
      noti.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
      noti.innerHTML = `
        <h3>✅ Jornada iniciada</h3>
        <p>Hora de inicio: <strong>${inicioTiempo.toLocaleTimeString()}</strong></p>
        <p id="tiempoTranscurrido">Tiempo transcurrido: 0s</p>
        <button id="btnFinalizarJornada" style="
          background:#c62828; 
          color:white; 
          padding:10px 15px; 
          border:none; 
          border-radius:6px; 
          cursor:pointer;
          margin-top:10px;
        ">Finalizar Jornada</button>
      `;
      content.appendChild(noti);

      // Iniciar contador
      intervalo = setInterval(() => {
        const ahora = new Date();
        const diff = Math.floor((ahora - inicioTiempo) / 1000); // segundos
        document.getElementById("tiempoTranscurrido").textContent =
          `Tiempo transcurrido: ${formatearTiempo(diff)}`;
      }, 1000);

      // Finalizar jornada
      document.getElementById("btnFinalizarJornada").addEventListener("click", () => {
        clearInterval(intervalo);
        const fin = new Date();
        const totalSegundos = Math.floor((fin - inicioTiempo) / 1000);

        alert(`🕒 Jornada finalizada.\nDuración total: ${formatearTiempo(totalSegundos)}`);

        // Reset
        inicioTiempo = null;
        intervalo = null;
        noti.remove();
      });
    });
  }
});