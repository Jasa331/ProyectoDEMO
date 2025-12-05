/* ===========================================================
    SELECTORES Y VARIABLES GLOBALES
=========================================================== */
const qs = sel => document.querySelector(sel);

const tbody = qs("#tbodyUsuarios");
const vacio = qs("#vacio");
const modal = qs("#modal");
const form = qs("#formUsuario");
const modalTitle = qs("#modalTitle");
const toastBox = qs("#toast");
const themeToggle = qs("#themeToggle");

let editId = null;
let filtro = "";
let toastTimer = null;

/* ===========================================================
    TOAST / NOTIFICACIONES
=========================================================== */
function toast(msg, tipo = "info") {
  if (!toastBox) return;
  toastBox.textContent = msg;
  toastBox.className = `toast show ${tipo}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastBox.classList.remove("show"), 2500);
}

/* ===========================================================
    API USUARIOS
=========================================================== */
const API_URL = "http://localhost:3000/usuarios";

async function fetchUsuarios() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Error al obtener usuarios");
    return await res.json();
  } catch (err) {
    toast(err.message, "error");
    return [];
  }
}

async function crearUsuario(data) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error al crear usuario");
  return json;
}

async function actualizarUsuario(id, data) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error al actualizar usuario");
  return json;
}

async function eliminarUsuario(id) {
  const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error al eliminar usuario");
  return json;
}

/* ===========================================================
    RENDERIZAR TABLA USUARIOS
=========================================================== */
async function renderTable() {
  if (!tbody) return;

  const usuarios = await fetchUsuarios();
  const term = filtro.trim().toLowerCase();

  const filtrados = usuarios.filter(u =>
    [u.Usuario_Nombre, u.Usuario_Apellido, u.Correo, u.Rol]
      .some(v => String(v || "").toLowerCase().includes(term))
  );

  tbody.innerHTML = filtrados.map(u => `
    <tr>
      <td>${u.Usuario_Nombre} ${u.Usuario_Apellido}</td>
      <td>${u.Usuario_Usuario || "—"}</td>
      <td>${u.Correo}</td>
      <td>${u.Rol}</td>
      <td>
        <div class="actions">
          <button class="action edit" data-id="${u.ID_Usuario}">✏️ Editar</button>
          <button class="action del" data-id="${u.ID_Usuario}">🗑️ Eliminar</button>
        </div>
      </td>
    </tr>
  `).join("");

  if (vacio) {
    vacio.style.display = filtrados.length ? "none" : "block";
  }

  renderStats(usuarios);
}

/* ===========================================================
    ESTADÍSTICAS DEL DASHBOARD
=========================================================== */
function renderStats(usuarios) {
  const total = usuarios.length;
  const admins = usuarios.filter(u => u.Rol === "Administrador").length;

  const statTotal = qs("#statTotal");
  const statAdmins = qs("#statAdmins");
  const statUsuarios = qs("#statUsuarios");

  if (statTotal) statTotal.textContent = total;
  if (statAdmins) statAdmins.textContent = admins;
  if (statUsuarios) statUsuarios.textContent = total - admins;
}

/* ===========================================================
    BUSCADOR
=========================================================== */
const inputBuscar = qs("#inputBuscar");
if (inputBuscar) {
  inputBuscar.addEventListener("input", e => {
    filtro = e.target.value;
    renderTable();
  });
}

/* ===========================================================
    MODAL USUARIOS
=========================================================== */
function openModal(edit = false, usuario = {}) {
  if (!modal || !form) return;

  editId = edit ? usuario.ID_Usuario : null;
  modal.classList.add("show");

  if (modalTitle) modalTitle.textContent = edit ? "Editar usuario" : "Nuevo usuario";

  form.nombre.value = usuario.Usuario_Nombre || "";
  form.apellido.value = usuario.Usuario_Apellido || "";
  form.usuario.value = usuario.Usuario_Usuario || "";
  form.correo.value = usuario.Correo || "";
  form.direccion.value = usuario.Direccion || "";
  form.telefono.value = usuario.Telefono || "";
  form.password.value = "";

  form.perfil.value = usuario.Rol || "Empleado";
}

function closeModal() {
  if (modal) modal.classList.remove("show");
}

const btnNuevo = qs("#btnNuevo");
const btnCancelar = qs("#btnCancelar");
const btnCerrarModal = qs("#btnCerrarModal");

if (btnNuevo) btnNuevo.addEventListener("click", () => openModal(false));
if (btnCancelar) btnCancelar.addEventListener("click", closeModal);
if (btnCerrarModal) btnCerrarModal.addEventListener("click", closeModal);

if (modal) {
  modal.addEventListener("click", e => {
    if (e.target === modal) closeModal();
  });
}

/* ===========================================================
    GUARDAR USUARIO
=========================================================== */
if (form) {
  form.addEventListener("submit", async e => {
    e.preventDefault();

    const payload = {
      Usuario_Nombre: form.nombre.value.trim(),
      Usuario_Apellido: form.apellido.value.trim(),
      Usuario_Usuario: form.usuario.value.trim(),
      Correo: form.correo.value.trim(),
      Rol: form.perfil.value,
      Direccion: form.direccion.value.trim(),
      Telefono: form.telefono.value.trim(),
      Contrasena: form.password.value.trim()
    };

    try {
      if (editId) {
        await actualizarUsuario(editId, payload);
        toast("Usuario actualizado 💾", "success");
      } else {
        await crearUsuario(payload);
        toast("Usuario creado ✅", "success");
      }
      closeModal();
      renderTable();
    } catch (err) {
      toast(err.message, "error");
    }
  });
}

/* ===========================================================
    ACCIONES EDITAR / ELIMINAR
=========================================================== */
if (tbody) {
  tbody.addEventListener("click", async e => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.dataset.id;

    if (btn.classList.contains("edit")) {
      const usuarios = await fetchUsuarios();
      const usuario = usuarios.find(u => u.ID_Usuario == id);
      if (usuario) openModal(true, usuario);

    } else if (btn.classList.contains("del")) {
      if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;

      try {
        await eliminarUsuario(id);
        toast("Usuario eliminado 🗑️", "success");
        renderTable();
      } catch (err) {
        toast(err.message, "error");
      }
    }
  });
}

/* ===========================================================
    MODO OSCURO / CLARO
=========================================================== */
function initTheme() {
  const saved = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  if (themeToggle) themeToggle.innerHTML = saved === "dark" ? "🌙" : "🌞";
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    const newTheme = dark ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);

    themeToggle.innerHTML = newTheme === "dark" ? "🌙" : "🌞";
  });
}

/* ===========================================================
    PROVEEDORES — MODAL
=========================================================== */
const modalProveedor = qs("#modalProveedor");
const btnNuevoProveedor = qs("#btnNuevoProveedor");
const btnCerrarModalProveedor = qs("#btnCerrarModalProveedor");
const btnCancelarProveedor = qs("#btnCancelarProveedor");

if (btnNuevoProveedor && modalProveedor) {
  btnNuevoProveedor.onclick = () => modalProveedor.style.display = "flex";
}
if (btnCerrarModalProveedor && modalProveedor) {
  btnCerrarModalProveedor.onclick = () => modalProveedor.style.display = "none";
}
if (btnCancelarProveedor && modalProveedor) {
  btnCancelarProveedor.onclick = () => modalProveedor.style.display = "none";
}

/* ===========================================================
    REGISTRAR PROVEEDOR
=========================================================== */
const formProveedor = qs("#formProveedor");
if (formProveedor) {
  formProveedor.addEventListener("submit", async e => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(e.target).entries());

    try {
      const res = await fetch("http://localhost:3000/proveedor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (result.ok) {
        toast("Proveedor registrado correctamente", "success");
        if (modalProveedor) modalProveedor.style.display = "none";
        cargarProveedores();
      } else {
        toast("Error: " + result.error, "error");
      }

    } catch (err) {
      toast("Error al conectar con el servidor", "error");
      console.error(err);
    }
  });
}

/* ===========================================================
    LISTAR PROVEEDORES
=========================================================== */
async function cargarProveedores() {
  try {
    const res = await fetch("http://localhost:3000/proveedor");
    const proveedores = await res.json();

    const tbodyProv = qs("#tbodyProveedores");
    const vacioProv = qs("#proveedorVacio");
    if (!tbodyProv) return;

    tbodyProv.innerHTML = "";

    proveedores.forEach(p => {
      tbodyProv.innerHTML += `
        <tr>
          <td>${p.ID_Proveedor}</td>
          <td>${p.Nombre_Empresa}</td>
          <td>${p.Nombre_Contacto}</td>
          <td>${p.Ciudad}</td>
          <td>${p.Telefono}</td>
          <td>${p.Region}</td>
          <td>${p.Cod_Postal}</td>
        </tr>`;
    });

    if (vacioProv) {
      vacioProv.style.display = proveedores.length ? "none" : "block";
    }

  } catch (err) {
    console.error("Error cargando proveedores:", err);
  }
}

/* ===========================================================
    CAMBIO DE SECCIONES (SIDEBAR)
=========================================================== */
function ocultarTodas() {
  document.querySelectorAll(".seccion").forEach(sec => {
    sec.style.display = "none";
    sec.classList.remove("visible");
  });

  document.querySelectorAll(".menu a").forEach(a => a.classList.remove("active"));
}

function mostrarSeccion(id) {
  ocultarTodas();

  const sec = document.getElementById(id);
  if (sec) {
    sec.style.display = "block";
    sec.classList.add("visible");
  }

  // Activar link del menú
  document.querySelectorAll(".menu a").forEach(a => {
    const onClick = a.getAttribute("onclick");
    if (onClick && onClick.includes(`'${id}'`)) {
      a.classList.add("active");
    }
  });

  // Acciones al entrar en cada módulo
  if (id === "usuarios") renderTable();
  if (id === "proveedores") cargarProveedores();
  if (id === "dashboard") renderTable(); // para stats
}

// Hacerla accesible desde el HTML (onclick)
window.mostrarSeccion = mostrarSeccion;

/* ===========================================================
    INICIALIZACIÓN
=========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  renderTable();
  cargarProveedores();
  mostrarSeccion("dashboard");
});
