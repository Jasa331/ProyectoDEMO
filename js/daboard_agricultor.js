/*
  Script combinado para dashboard agricultor/empleado:
  - mostrarSeccion / ocultarTodas (únicas, expuestas globalmente)
  - control de sesión y saludo
  - cargarPerfil (llama a /perfil/:id)
  - manejo de modal clima
  - cambio de tema (btnFlotante y btnFlotante2)
  - utilidades
*/

function ocultarTodas() {
  const secciones = document.querySelectorAll('.seccion');
  secciones.forEach(sec => {
    sec.style.display = 'none';
    sec.classList.remove('activa');
  });
}

function mostrarSeccion(id) {
  // Caso especial: cerrar sesión
  if (id === 'cerrarSesion') {
    const confirmar = confirm("¿Estás seguro que deseas cerrar sesión?");
    if (!confirmar) {
      mostrarSeccion('dashboard');
      return;
    }

    localStorage.clear();
    sessionStorage.clear();

    // Redirigir al inicio (ruta absoluta desde la raíz estática /HTML)
    window.location.href = '/index_Inicio.html';
    return;
  }

  ocultarTodas();
  const target = document.getElementById(id);
  if (target) {
    target.style.display = 'block';
    // disparar animación CSS si aplica
    setTimeout(() => target.classList.add('activa'), 10);

    // acciones al mostrar secciones específicas
    if (id === 'perfil') cargarPerfil();
    if (id === 'reportes' || id === 'inventario') activarEventos(id);
  } else {
    console.warn(`La sección "${id}" no existe en el DOM.`);
  }
}

// Exponer la función para los onclick del HTML
window.mostrarSeccion = mostrarSeccion;


// ==============================
// EVENTOS / FUNCIONES AUX
// ==============================
function activarEventos(id) {
  if (id === "reportes") {
    // placeholder: cargar reportes
    console.log("Mostrando reportes...");
  }
  if (id === "inventario") {
    console.log("Mostrando inventario...");
  }
}

function formatearTiempo(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  return `${h}h ${m}m ${s}s`;
}


// ==============================
// CARGAR PERFIL (desde backend)
// ==============================
async function cargarPerfil() {
  const data = localStorage.getItem("user") || localStorage.getItem("usuarioActivo");
  if (!data) {
    console.warn("cargarPerfil: no hay usuario en localStorage");
    return;
  }

  let userLocal;
  try {
    userLocal = JSON.parse(data);
  } catch (e) {
    console.error("cargarPerfil: JSON inválido en localStorage 'user':", e);
    return;
  }

  const id = userLocal.ID_Usuario || userLocal.id || userLocal.ID;
  if (!id) {
    console.warn("cargarPerfil: falta ID_Usuario en el objeto user");
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/perfil/${id}`);
    if (!res.ok) {
      console.error("cargarPerfil: respuesta HTTP no OK", res.status, res.statusText);
      return;
    }

    const result = await res.json();
    if (!result.ok) {
      console.error("cargarPerfil: API devolvió error:", result.error);
      return;
    }

    const user = result.usuario || result.user || result;
    if (!user) {
      console.error("cargarPerfil: respuesta no contiene usuario");
      return;
    }

    const setText = (idEl, value) => {
      const el = document.getElementById(idEl);
      if (el) el.textContent = value ?? "";
    };

    setText("p_nombre", user.Usuario_Nombre || user.Nombre || user.nombre || "");
    setText("p_apellido", user.Usuario_Apellido || user.Apellido || user.apellido || "");
    setText("p_correo", user.Correo || user.email || user.correo || "");
    setText("p_telefono", user.Telefono || user.telefono || user.phone || "");
    setText("p_direccion", user.Direccion || user.direccion || user.address || "");
    setText("p_rol", user.Rol || user.rol || user.role || "");
  } catch (error) {
    console.error("Error llamando al backend en cargarPerfil:", error);
  }
}


// ==============================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  // Control de sesión (compatible con keys 'user' y 'usuarioActivo')
  const usuarioActivo = localStorage.getItem("user") || localStorage.getItem("usuarioActivo");
  if (!usuarioActivo) {
    // Si estás en una vista pública del dashboard (p. ej. demo), podrías comentar la siguiente línea.
    alert("Debes iniciar sesión primero");
    window.location.href = "/index_login.html";
    return;
  }

  let datos;
  try {
    datos = JSON.parse(usuarioActivo);
  } catch (_) {
    datos = {};
  }

  const nombre = datos?.Usuario_Nombre || datos?.Nombre || datos?.nombre || "Usuario";

  // Prepend saludo si existe .content
  const saludo = document.createElement("div");
  saludo.className = "saludo-panel";
  saludo.textContent = `HOLA ${nombre}, bienvenido al panel de Agricultor.`;
  const content = document.querySelector(".content");
  if (content && !content.querySelector(".saludo-panel")) content.prepend(saludo);

  // Manejo del modal de clima (si existe)
  const openMonitor = document.getElementById("openMonitor");
  const climaModal = document.getElementById("climaModal");
  const closeModal = document.getElementById("closeModal");

  if (openMonitor && climaModal) {
    openMonitor.addEventListener("click", (e) => {
      e.preventDefault();
      climaModal.style.display = "flex";
    });
  }
  if (closeModal && climaModal) {
    closeModal.addEventListener("click", () => { climaModal.style.display = "none"; });
  }
  window.addEventListener("click", (e) => {
    if (climaModal && e.target === climaModal) climaModal.style.display = "none";
  });

  // Mostrar dashboard por defecto
  mostrarSeccion('dashboard');

  // Inicializar tema guardado
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  // Botones para cambiar tema (proteger contra null)
  const btnThemePrimary = document.getElementById("btnFlotante");   // usado en index_dasborad_agricultor.html
  const btnThemeAlt = document.getElementById("btnFlotante2");     // usado en otros dashboards

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute("data-theme");
    const nuevo = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nuevo);
    localStorage.setItem("theme", nuevo);
  };

  if (btnThemePrimary) btnThemePrimary.addEventListener("click", toggleTheme);
  if (btnThemeAlt) btnThemeAlt.addEventListener("click", toggleTheme);

  // Función pública para cerrar sesión (la llaman algunos HTML con onclick="cerrarSesion()")
  window.cerrarSesion = () => {
    const confirmar = confirm("¿Estás seguro que deseas cerrar sesión?");
    if (!confirmar) return;

    localStorage.clear();
    sessionStorage.clear();

    // redirigir al inicio (archivo dentro de la carpeta HTML servida como estática)
    window.location.href = '../HTML/index_login.html';
  }

  // Enlazar botón de logout si existe (protege contra null)
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      cerrarSesion();
    });
  }
});

// Función para obtener y renderizar reportes del agricultor logueado
async function renderReportes() {
  const cont = document.getElementById('reportes');
  if (!cont) return;
  let container = cont.querySelector('.reportes-list');
  if (!container) {
    container = document.createElement('div');
    container.className = 'reportes-list';
    cont.appendChild(container);
  }
  container.innerHTML = '<p>Cargando reportes...</p>';

  // obtener ID agricultor desde localStorage
  let idAgr = null;
  try {
    const raw = localStorage.getItem('user') || localStorage.getItem('usuarioActivo');
    const u = raw ? JSON.parse(raw) : null;
    idAgr = u?.ID_Usuario || u?.id || null;
  } catch (e) { idAgr = null; }

  const q = idAgr ? `?destinatario=${encodeURIComponent(idAgr)}` : '';
  try {
    const res = await fetch(`http://localhost:3000/reportes${q}`);
    const json = await res.json();
    const arr = (json.ok && Array.isArray(json.reportes)) ? json.reportes : [];
    if (!arr.length) {
      container.innerHTML = '<p>No hay reportes recientes.</p>';
      return;
    }
    container.innerHTML = arr.map(r => {
      const fecha = new Date(r.createdAt).toLocaleString();
      const imgs = (r.imagenes||[]).slice(0,3).map(i => `<img src="${i.Url || i.url}" style="max-width:120px;margin:6px;border-radius:6px">`).join('');
      return `
        <article class="reporte-card card" style="margin-bottom:12px;padding:12px">
          <header style="display:flex;justify-content:space-between;align-items:center">
            <strong style="color:var(--primary)">Empleado #${r.empleadoId ?? '—'}</strong>
            <small style="color:var(--text-muted)">${fecha}</small>
          </header>
          <p style="margin:8px 0;color:var(--text-light)">${(r.texto||'').replaceAll('\n','<br>')}</p>
          <div class="reporte-thumbs">${imgs}</div>
        </article>
      `;
    }).join('');
  } catch (err) {
    console.error('Error cargando reportes:', err);
    container.innerHTML = '<p>Error al cargar reportes.</p>';
  }
}

// Llamar cuando se muestra la sección reportes
const _origMostrarSeccion = window.mostrarSeccion;
window.mostrarSeccion = function(id) {
  if (id === 'reportes') {
    renderReportes();
  }
  return _origMostrarSeccion ? _origMostrarSeccion(id) : undefined;
};

// Escuchar notificaciones de otras pestañas
window.addEventListener('storage', (e) => {
  if (e.key === 'reportes_updated') renderReportes();
});

// render inicial si hash = reportes
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash.replace('#','') === 'reportes') renderReportes();
});
