/*
  Script combinado para dashboard agricultor/empleado:
  - mostrarSeccion / ocultarTodas
  - control sesión y saludo
  - cargarPerfil
  - inventario filtrado por ID_Usuario
  - modal clima
  - tema oscuro
  - reportes
*/

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
  // cerrar sesión
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

    // ACCIONES ESPECÍFICAS AL ENTRAR
    if (id === 'perfil') cargarPerfil();
    if (id === 'reportes') renderReportes();
    if (id === 'inventario') cargarInventario();

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

  let userLocal;
  try { userLocal = JSON.parse(data); } catch { return; }

  const id = userLocal.ID_Usuario || userLocal.id;
  if (!id) return;

  try {
    const res = await fetch(`http://localhost:3000/perfil/${id}`);
    const result = await res.json();
    const user = result.usuario || result.user;

    const setText = (idEl, value) => {
      const e = document.getElementById(idEl);
      if (e) e.textContent = value ?? "";
    };

    setText("p_nombre", user.Usuario_Nombre);
    setText("p_apellido", user.Usuario_Apellido);
    setText("p_correo", user.Correo);
    setText("p_telefono", user.Telefono);
    setText("p_direccion", user.Direccion);
    setText("p_rol", user.Rol);

  } catch (error) {
    console.error("Error perfil:", error);
  }
}


// ==============================
// INVENTARIO FILTRADO POR USUARIO LOGUEADO
// ==============================
async function cargarInventario() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch("http://localhost:3000/insumos", {
      headers: {
        "Authorization": "Bearer " + token
      }
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

  // Abrir dashboard al inicio
  mostrarSeccion('dashboard');
});


// ==============================
// REPORTES (SIGUE IGUAL, FUNCIONAL)
// ==============================
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

    // Render original con todo el estilo
    container.innerHTML = arr.map(r => {
      const fecha = new Date(r.createdAt).toLocaleString();
      const imgs = (r.imagenes||[]).slice(0,3).map(i => 
        `<img src="${i.Url || i.url}" style="max-width:120px;margin:6px;border-radius:6px;">`
      ).join('');

      return `
        <article class="reporte-card card" 
            style="margin-bottom:12px;padding:12px;border-radius:10px;background:white;box-shadow:0 2px 5px rgba(0,0,0,0.1);">
          
          <header style="display:flex;justify-content:space-between;align-items:center">
            <strong style="color:#2e7d32;font-size:16px">Empleado #${r.empleadoId ?? '—'}</strong>
            <small style="color:#777">${fecha}</small>
          </header>

          <p style="margin:10px 0;color:#444;font-size:15px;line-height:1.5;">
            ${(r.texto || '').replaceAll('\n','<br>')}
          </p>

          <div class="reporte-thumbs" style="margin-top:8px;">
            ${imgs}
          </div>
        </article>
      `;
    }).join('');

  } catch (err) {
    console.error('Error cargando reportes:', err);
    container.innerHTML = '<p>Error al cargar reportes.</p>';
  }
}


