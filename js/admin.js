/* ===========================================================
   UTILIDADES
=========================================================== */
const qs = sel => document.querySelector(sel);
const qsa = sel => document.querySelectorAll(sel);

/* ===========================================================
   SESIÓN / TOKEN
=========================================================== */
const token = localStorage.getItem("token");
const usuarioActual = JSON.parse(localStorage.getItem("user"));
const ID_Usuario = usuarioActual?.ID_Usuario;

if (!token || !usuarioActual) {
  alert("Sesión expirada. Inicia sesión nuevamente.");
  window.location.href = "../HTML/index_login.html";
}

/* ===========================================================
   VARIABLES
=========================================================== */
const modal = qs("#modal");
const modalTitle = qs("#modalTitle");
const form = qs("#formUsuario");
const tbody = qs("#tbodyUsuarios");
const vacio = qs("#vacio");
let editId = null;

const modalGasto = qs("#modalGasto");
const btnAbrirGasto = qs("#btnAbrirGasto");
const btnCerrarGasto = qs("#btnCerrarGasto");
const btnCancelarGasto = qs("#btnCancelarGasto");
const formGastoModal = qs("#formGastoModal");

// Proveedores modal
const modalProveedor = qs("#modalProveedor");
const btnAbrirProveedor = qs("#btnNuevoProveedor");
const btnCerrarModalProveedor = qs("#btnCerrarModalProveedor");
const btnCancelarProveedor = qs("#btnCancelarProveedor");
// =============================
// MODAL PROVEEDOR
// =============================
function abrirModalProveedor() { modalProveedor?.classList.add("show"); }
function cerrarModalProveedor() { modalProveedor?.classList.remove("show"); }

btnAbrirProveedor?.addEventListener("click", abrirModalProveedor);
btnCerrarModalProveedor?.addEventListener("click", cerrarModalProveedor);
btnCancelarProveedor?.addEventListener("click", cerrarModalProveedor);
// =============================
// CERRAR SESIÓN
// =============================
const btnLogout = qs("#btnLogout");
btnLogout?.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "../HTML/index_login.html";
});

/* ===========================================================
   TOAST
=========================================================== */
const toastBox = qs("#toast");
let toastTimer = null;

function toast(msg, type = "info") {
  if (!toastBox) return;
  toastBox.textContent = msg;
  toastBox.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastBox.classList.remove("show"), 2500);
}

/* ===========================================================
   SECCIONES
=========================================================== */
function ocultarTodas() {
  qsa(".seccion").forEach(sec => {
    sec.style.display = "none";
    sec.classList.remove("visible");
  });

  qsa(".menu a").forEach(a => a.classList.remove("active"));
}

function mostrarSeccion(id) {
  ocultarTodas();

  const sec = qs(`#${id}`);
  if (sec) {
    sec.style.display = "block";
    sec.classList.add("visible");
  }

  qsa(".menu a").forEach(a => {
    if (a.getAttribute("onclick")?.includes(`'${id}'`)) {
      a.classList.add("active");
    }
  });

  if (id === "usuarios") renderUsuarios();
  if (id === "gastos") cargarGastos();
  if (id === "proveedores") cargarProveedores();
  if (id === "dashboard") renderUsuarios();
}

window.mostrarSeccion = mostrarSeccion;

/* ===========================================================
   USUARIOS
=========================================================== */
async function fetchUsuarios() {
  try {
    const res = await fetch("http://localhost:3000/usuarios/mis-creados", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    toast("Error al cargar usuarios", "error");
    return [];
  }
}

async function renderUsuarios() {
  const usuarios = await fetchUsuarios();

  tbody.innerHTML = usuarios.map(u => `
    <tr>
      <td>${u.Usuario_Nombre} ${u.Usuario_Apellido}</td>
      <td>${u.Correo}</td>
      <td>${u.Rol}</td>
      <td>
        <button class="action edit" data-id="${u.ID_Usuario}">✏️</button>
        <button class="action del" data-id="${u.ID_Usuario}">🗑️</button>
      </td>
    </tr>
  `).join("");

  if (vacio) vacio.style.display = usuarios.length ? "none" : "block";
}

/* ===========================================================
   MODAL USUARIO
=========================================================== */
function openModal(edit = false, usuario = {}) {
  editId = edit ? usuario.ID_Usuario : null;

  modal?.classList.add("show");
  if (modalTitle) modalTitle.textContent = edit ? "Editar usuario" : "Nuevo usuario";

  if (!form) return;

  form.nombre.value = usuario.Usuario_Nombre || "";
  form.apellido.value = usuario.Usuario_Apellido || "";
  form.correo.value = usuario.Correo || "";
  form.direccion.value = usuario.Direccion || "";
  form.telefono.value = usuario.Telefono || "";
  form.perfil.value = usuario.Rol || "Empleado";
  form.password.value = "";
}

function closeModal() {
  modal?.classList.remove("show");
}

qs("#btnNuevo")?.addEventListener("click", () => openModal());
qs("#btnCancelar")?.addEventListener("click", closeModal);
qs("#btnCerrarModal")?.addEventListener("click", closeModal);

/* ===========================================================
   GUARDAR USUARIO (POST / PUT)
=========================================================== */
form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    Usuario_Nombre: form.nombre.value.trim(),
    Usuario_Apellido: form.apellido.value.trim(),
    Correo: form.correo.value.trim(),
    Direccion: form.direccion.value.trim(),
    Telefono: form.telefono.value.trim(),
    Rol: form.perfil.value,
    Contrasena: form.password.value
  };

  const url = editId
    ? `http://localhost:3000/usuarios/${editId}`
    : `http://localhost:3000/usuarios`;

  const method = editId ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json.ok) {
    toast(json.error || "Error al guardar usuario", "error");
    return;
  }

  toast("Usuario guardado", "success");
  closeModal();
  renderUsuarios();
});

/* ===========================================================
   EDITAR / ELIMINAR USUARIO
=========================================================== */
tbody?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = btn.dataset.id;

  if (btn.classList.contains("edit")) {
    const usuarios = await fetchUsuarios();
    const usuario = usuarios.find(u => String(u.ID_Usuario) === String(id));
    return openModal(true, usuario || {});
  }

  if (btn.classList.contains("del")) {
    if (!confirm("¿Eliminar usuario?")) return;

    await fetch(`http://localhost:3000/usuarios/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    toast("Usuario eliminado", "success");
    renderUsuarios();
  }
});

/* ===========================================================
   PROVEEDORES
=========================================================== */
async function cargarProveedores() {
  const res = await fetch("http://localhost:3000/proveedor", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return;

  const data = await res.json();
  const tb = qs("#tbodyProveedores");

  if (!tb) return;

  tb.innerHTML = data.map(p => `
    <tr>
      <td>${p.ID_Proveedor}</td>
      <td>${p.Nombre_Empresa}</td>
      <td>${p.Nombre_Contacto}</td>
      <td>${p.Ciudad}</td>
      <td>${p.Telefono}</td>
      <td>${p.Region}</td>
      <td>${p.Cod_Postal}</td>
    </tr>
  `).join("");
}

/* ===========================================================
   GASTOS — LISTAR
=========================================================== */
async function cargarGastos() {
  const tb = qs("#tablaGastos");
  if (!tb) return;

  tb.innerHTML = "<tr><td colspan='4'>Cargando...</td></tr>";

  if (!ID_Usuario) {
    tb.innerHTML = "<tr><td colspan='4'>No hay usuario logueado</td></tr>";
    return;
  }

  const res = await fetch(`http://localhost:3000/gastos/usuario/${ID_Usuario}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    tb.innerHTML = "<tr><td colspan='4'>Error al cargar gastos</td></tr>";
    return;
  }

  const data = await res.json();

  if (!data.length) {
    tb.innerHTML = "<tr><td colspan='4'>Sin registros</td></tr>";
    return;
  }

  tb.innerHTML = data.map(g => `
    <tr>
      <td>${g.concepto}</td>
      <td>$${g.monto}</td>
      <td>${g.categoria ?? ""}</td>
      <td>${g.fecha}</td>
    </tr>
  `).join("");
}

/* ===========================================================
   MODAL GASTOS
=========================================================== */
function abrirModalGasto() { modalGasto?.classList.add("show"); }
function cerrarModalGasto() { modalGasto?.classList.remove("show"); }

btnAbrirGasto?.addEventListener("click", abrirModalGasto);
btnCerrarGasto?.addEventListener("click", cerrarModalGasto);
btnCancelarGasto?.addEventListener("click", cerrarModalGasto);

/* ===========================================================
   REGISTRAR GASTO
=========================================================== */
formGastoModal?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const concepto = qs("#conceptoModal")?.value?.trim();
  const monto = qs("#montoModal")?.value;
  const categoria = qs("#categoriaModal")?.value?.trim() || null;
  const fecha = new Date().toISOString().split("T")[0];

  const res = await fetch("http://localhost:3000/gastos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ concepto, monto, categoria, fecha, ID_Usuario })
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json.ok) {
    toast("Error: " + (json.error || "No se pudo registrar"), "error");
    return;
  }

  toast("Gasto registrado", "success");
  cerrarModalGasto();
  cargarGastos();
});

/* ===========================================================
   INICIO
=========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  renderUsuarios();
  cargarProveedores();
  mostrarSeccion("dashboard");
});
