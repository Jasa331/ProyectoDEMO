/*
  Script combinado para dashboard agricultor/empleado:
  - mostrarSeccion / ocultarTodas
  - control sesión y saludo
  - cargarPerfil
  - inventario filtrado por ID_Usuario
  - reportes
  - mis cultivos (nuevo)
*/

// ==============================
// ⚠️ CONFIGURACIÓN GLOBAL
// ==============================
const API_BASE = "http://localhost:3000";

// ==============================
// OCULTAR Y MOSTRAR SECCIONES
// ==============================
function ocultarTodas() {
  const secciones = document.querySelectorAll('.seccion');
  secciones.forEach(sec => {
    sec.style.display = 'none';
    sec.classList.remove('activa');
  });
}

function mostrarSeccion(id) {
  if (id === 'cerrarSesion') {
    if (!confirm("¿Estás seguro que deseas cerrar sesión?")) return;
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/index_Inicio.html';
    return;
  }

  ocultarTodas();

  const target = document.getElementById(id);
  if (target) {
    target.style.display = 'block';
    setTimeout(() => target.classList.add('activa'), 10);

    if (id === 'perfil') cargarPerfil();
    if (id === 'reportes') renderReportes();
    if (id === 'inventario') cargarInventario();
    if (id === 'cultivos') cargarMisCultivos(); // 🔥 NUEVO
  } else {
    console.warn(`La sección "${id}" no existe.`);
  }
}

window.mostrarSeccion = mostrarSeccion;


// ==============================
// CARGAR PERFIL
// ==============================
async function cargarPerfil() {
  const data = localStorage.getItem("user") || localStorage.getItem("usuarioActivo");
  if (!data) return;

  let userLocal = null;
  try { userLocal = JSON.parse(data); } catch { return; }

  const id = userLocal.ID_Usuario || userLocal.id;
  if (!id) return;

  try {
    const res = await fetch(`${API_BASE}/perfil/${id}`);
    const result = await res.json();
    const user = result.usuario || result.user;

    const map = {
      "p_nombre": user.Usuario_Nombre,
      "p_apellido": user.Usuario_Apellido,
      "p_correo": user.Correo,
      "p_telefono": user.Telefono,
      "p_direccion": user.Direccion,
      "p_rol": user.Rol
    };

    Object.entries(map).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value ?? "";
    });

  } catch (error) {
    console.error("Error cargando perfil:", error);
  }
}


// ==============================
// INVENTARIO FILTRADO POR USUARIO LOGUEADO
// ==============================
async function cargarInventario() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/insumos`, {
      headers: { "Authorization": "Bearer " + token }
    });

    const insumos = await res.json();
    renderInventario(insumos);

  } catch (err) {
    console.error("Error obteniendo inventario:", err);
  }
}

function renderInventario(insumos) {
  const tbody = document.getElementById("tbodyInventario");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!insumos || !insumos.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;">🚫 No tienes insumos registrados</td>
      </tr>`;
    return;
  }

  insumos.forEach(ins => {
    tbody.innerHTML += `
      <tr>
        <td>${ins.Nombre}</td>
        <td>${ins.Tipo || "—"}</td>
        <td>${ins.Descripcion || "—"}</td>
        <td>${ins.Unidad_Medida || "—"}</td>
        <td>${ins.Cantidad}</td>
        <td>${ins.Fecha_Caducidad || "—"}</td>
      </tr>
    `;
  });
}


// ==============================
// SALUDO Y SESIÓN
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const usuarioActivo = localStorage.getItem("user") || localStorage.getItem("usuarioActivo");
  if (!usuarioActivo) {
    alert("Debes iniciar sesión primero");
    window.location.href = "/index_login.html";
    return;
  }

  let datos = JSON.parse(usuarioActivo);
  const nombre = datos.Usuario_Nombre || datos.Nombre || "Usuario";

  const saludo = document.createElement("div");
  saludo.className = "saludo-panel";
  saludo.textContent = `HOLA ${nombre}, bienvenido al panel de Agricultor.`;

  const content = document.querySelector(".content");
  if (content && !content.querySelector(".saludo-panel")) content.prepend(saludo);

  mostrarSeccion('dashboard');
});


// ==============================
// REPORTES
// ==============================
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

  let idAgr = null;
  try {
    const raw = localStorage.getItem('user') || localStorage.getItem('usuarioActivo');
    const u = raw ? JSON.parse(raw) : null;
    idAgr = u?.ID_Usuario || u?.id || null;
  } catch {}

  try {
    const res = await fetch(`${API_BASE}/reportes?destinatario=${idAgr}`);
    const json = await res.json();

    if (!json.ok || !json.reportes.length) {
      container.innerHTML = '<p>No hay reportes recientes.</p>';
      return;
    }

    container.innerHTML = json.reportes
      .map(r => {
        const fecha = new Date(r.createdAt).toLocaleString();
        const imgs = (r.imagenes || [])
          .slice(0, 3)
          .map(i => `<img src="${i.Url}" style="max-width:120px;margin:6px;border-radius:6px;">`)
          .join("");

        return `
          <article class="reporte-card card" style="margin-bottom:12px;padding:12px;border-radius:10px;background:white;">
            <header style="display:flex;justify-content:space-between;">
              <strong style="color:#2e7d32;">Empleado #${r.empleadoId ?? '—'}</strong>
              <small style="color:#777">${fecha}</small>
            </header>
            <p style="margin:10px 0;color:#444;">${(r.texto || '').replace(/\n/g, '<br>')}</p>
            <div>${imgs}</div>
          </article>
        `;
      })
      .join('');

  } catch (err) {
    console.error("Error reportes:", err);
    container.innerHTML = '<p>Error al cargar reportes.</p>';
  }
}


// ==============================
// MIS CULTIVOS — SOLO DEL USUARIO LOGUEADO
// ==============================
async function cargarMisCultivos() {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("No hay token en localStorage");
      return;
    }

    const res = await fetch(`${API_BASE}/calendario/cultivos`, {
      headers: { "Authorization": "Bearer " + token }
    });

    const json = await res.json();
    console.log("Respuesta mis cultivos:", json);

    const tbody = document.getElementById("misCultivosBody");
    tbody.innerHTML = "";

    if (!json.ok) {
      tbody.innerHTML = `<tr><td colspan="3">${json.message || "Error desconocido"}</td></tr>`;
      return;
    }

    if (!json.cultivos || json.cultivos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3">No tienes cultivos registrados.</td></tr>`;
      return;
    }

    json.cultivos.forEach(c => {
      tbody.innerHTML += `
        <tr>
          <td>${c.Producto}</td>
          <td>${c.Ubicacion || "—"}</td>
          <td>${c.Estado}</td>
        </tr>
      `;
    });

  } catch (err) {
    console.error("❌ Error cargando mis cultivos:", err);
  }
}

function cerrarSesion() {
    const confirmar = confirm("¿Estás seguro que deseas cerrar sesión?");

    if (!confirmar) return;

    // Elimina TODA la sesión
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("usuarioActivo");
    sessionStorage.clear();

    // Redirige al inicio de sesión
    window.location.href = "../HTML/index_login.html";
}


