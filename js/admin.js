/* ===========================================================
   SELECTORES / UTILIDAD
=========================================================== */
const qs = sel => document.querySelector(sel);
const qsa = sel => document.querySelectorAll(sel);

/* ===========================================================
   VARIABLES GLOBALES NECESARIAS
=========================================================== */
const modal = qs("#modal");
const modalTitle = qs("#modalTitle");
const form = qs("#formUsuario");
const tbody = qs("#tbodyUsuarios");
const vacio = qs("#vacio");
let editId = null;

const themeToggle = qs("#themeToggle");

const modalGasto = qs("#modalGasto");
const btnAbrirGasto = qs("#btnAbrirGasto");
const btnCerrarGasto = qs("#btnCerrarGasto");
const btnCancelarGasto = qs("#btnCancelarGasto");
const formGastoModal = qs("#formGastoModal");

const usuarioActual = JSON.parse(localStorage.getItem("user"));
const ID_Usuario = usuarioActual?.ID_Usuario;

/* ===========================================================
   SISTEMA DE SECCIONES
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

  if (id === "usuarios") renderTable();
  if (id === "proveedores") cargarProveedores();
  if (id === "gastos") cargarGastos();
  if (id === "dashboard") renderTable();
}

window.mostrarSeccion = mostrarSeccion;

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
   CRUD USUARIOS
=========================================================== */
async function fetchUsuarios() {
  try {
    const res = await fetch("http://localhost:3000/usuarios");
    if (!res.ok) return [];
    return await res.json();
  } catch {
    toast("Error al cargar usuarios", "error");
    return [];
  }
}

async function renderTable() {
  const usuarios = await fetchUsuarios();

  tbody.innerHTML = usuarios.map(u => `
    <tr>
      <td>${u.Usuario_Nombre} ${u.Usuario_Apellido}</td>
      <td>${u.Usuario_Usuario || "—"}</td>
      <td>${u.Correo}</td>
      <td>${u.Rol}</td>
      <td>
        <button class="action edit" data-id="${u.ID_Usuario}">✏️</button>
        <button class="action del" data-id="${u.ID_Usuario}">🗑️</button>
      </td>
    </tr>
  `).join("");

  vacio.style.display = usuarios.length ? "none" : "block";

  renderStats(usuarios);
}

function renderStats(usuarios) {
  qs("#statTotal").textContent = usuarios.length;
  qs("#statAdmins").textContent = usuarios.filter(u => u.Rol === "Administrador").length;
  qs("#statUsuarios").textContent = usuarios.filter(u => u.Rol !== "Administrador").length;
}

/* ===========================================================
   MODAL USUARIO
=========================================================== */
function openModal(edit = false, usuario = {}) {
  editId = edit ? usuario.ID_Usuario : null;

  modal.classList.add("show");
  modalTitle.textContent = edit ? "Editar usuario" : "Nuevo usuario";

  form.nombre.value = usuario.Usuario_Nombre || "";
  form.apellido.value = usuario.Usuario_Apellido || "";
  form.usuario.value = usuario.Usuario_Usuario || "";
  form.correo.value = usuario.Correo || "";
  form.direccion.value = usuario.Direccion || "";
  form.telefono.value = usuario.Telefono || "";
  form.perfil.value = usuario.Rol || "Empleado";
  form.password.value = "";
}

function closeModal() {
  modal.classList.remove("show");
}

qs("#btnNuevo")?.addEventListener("click", () => openModal());
qs("#btnCancelar")?.addEventListener("click", closeModal);
qs("#btnCerrarModal")?.addEventListener("click", closeModal);

/* ===========================================================
   GUARDAR USUARIO
=========================================================== */
form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    Usuario_Nombre: form.nombre.value,
    Usuario_Apellido: form.apellido.value,
    Usuario_Usuario: form.usuario.value,
    Correo: form.correo.value,
    Direccion: form.direccion.value,
    Telefono: form.telefono.value,
    Rol: form.perfil.value,
    Contrasena: form.password.value
  };

  const url = editId
    ? `http://localhost:3000/usuarios/${editId}`
    : `http://localhost:3000/usuarios`;

  const method = editId ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const json = await res.json();

  if (json.ok) toast("Usuario guardado", "success");
  else toast("Error al guardar usuario", "error");

  closeModal();
  renderTable();
});

/* ===========================================================
   TABLA EVENTOS (EDITAR/ELIMINAR)
=========================================================== */
tbody?.addEventListener("click", async e => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = btn.dataset.id;

  if (btn.classList.contains("edit")) {
    const usuarios = await fetchUsuarios();
    const usuario = usuarios.find(u => u.ID_Usuario == id);
    return openModal(true, usuario);
  }

  if (btn.classList.contains("del")) {
    if (!confirm("¿Eliminar usuario?")) return;

    await fetch(`http://localhost:3000/usuarios/${id}`, { method: "DELETE" });
    toast("Usuario eliminado", "success");
    renderTable();
  }
});

/* ===========================================================
   PROVEEDORES
=========================================================== */
async function cargarProveedores() {
  const res = await fetch("http://localhost:3000/proveedor");
  if (!res.ok) return;

  const data = await res.json();
  const tbody = qs("#tbodyProveedores");

  tbody.innerHTML = data.map(p => `
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

  qs("#proveedorVacio").style.display = data.length ? "none" : "block";
}

/* ===========================================================
   GASTOS — CARGAR LISTA
=========================================================== */
async function cargarGastos() {
  const tbody = qs("#tablaGastos");
  tbody.innerHTML = "<tr><td colspan='4'>Cargando...</td></tr>";

  if (!ID_Usuario) {
    tbody.innerHTML = "<tr><td colspan='4'>No hay usuario logueado</td></tr>";
    return;
  }

  const res = await fetch(`http://localhost:3000/gastos/usuario/${ID_Usuario}`);
  if (!res.ok) {
    tbody.innerHTML = "<tr><td colspan='4'>Error al cargar gastos</td></tr>";
    return;
  }

  const data = await res.json();

  if (!data.length) {
    tbody.innerHTML = "<tr><td colspan='4'>Sin registros</td></tr>";
    return;
  }

  tbody.innerHTML = data.map(g => `
    <tr>
      <td>${g.concepto}</td>
      <td>$${g.monto}</td>
      <td>${g.categoria}</td>
      <td>${g.fecha}</td>
    </tr>
  `).join("");
}

/* ===========================================================
   MODAL GASTOS (ABRIR/CERRAR)
=========================================================== */
function abrirModalGasto() {
  modalGasto.classList.add("show");
}
function cerrarModalGasto() {
  modalGasto.classList.remove("show");
}

btnAbrirGasto?.addEventListener("click", abrirModalGasto);
btnCerrarGasto?.addEventListener("click", cerrarModalGasto);
btnCancelarGasto?.addEventListener("click", cerrarModalGasto);

/* ===========================================================
   REGISTRAR GASTO
=========================================================== */
formGastoModal?.addEventListener("submit", async e => {
  e.preventDefault();

  const concepto = qs("#conceptoModal").value;
  const monto = qs("#montoModal").value;
  const categoria = qs("#categoriaModal").value;
  const fecha = new Date().toISOString().split("T")[0];

  const res = await fetch("http://localhost:3000/gastos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      concepto,
      monto,
      categoria,
      fecha,
      ID_Usuario
    })
  });

  const json = await res.json();

  if (!json.ok) {
    toast("Error: " + json.error, "error");
    return;
  }

  toast("Gasto registrado", "success");
  cerrarModalGasto();
  cargarGastos();
});

/* ===========================================================
   TEMA OSCURO
=========================================================== */
function initTheme() {
  const saved = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);

  if (themeToggle) {
    themeToggle.textContent = saved === "dark" ? "🌙" : "🌞";
  }
}

themeToggle?.addEventListener("click", () => {
  const now = document.documentElement.getAttribute("data-theme");
  const next = now === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
});

/* ===========================================================
   INICIO
=========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  renderTable();
  cargarProveedores();
  mostrarSeccion("dashboard");
});

/* ===========================================================
   MODAL EXPORTAR
=========================================================== */

const modalExportar = qs("#modalExportar");
const btnExportar = qs("#btnExportar");
const btnCerrarExportar = qs("#btnCerrarExportar");
const btnCancelarExportar = qs("#btnCancelarExportar");

const expUsuarios = qs("#expUsuarios");
const expGastos = qs("#expGastos");
const expProveedores = qs("#expProveedores");
const expProductos = qs("#expProductos");
const expCultivos = qs("#expCultivos");
const expTodo = qs("#expTodo");

function abrirModalExportar() {
  modalExportar.classList.add("show");
}

function cerrarModalExportar() {
  modalExportar.classList.remove("show");
}

btnExportar?.addEventListener("click", abrirModalExportar);
btnCancelarExportar?.addEventListener("click", cerrarModalExportar);
btnCerrarExportar?.addEventListener("click", cerrarModalExportar);

/* ===========================================================
   SELECCIONAR TODO
=========================================================== */
expTodo?.addEventListener("change", () => {
  const state = expTodo.checked;
  expUsuarios.checked = state;
  expGastos.checked = state;
  expProveedores.checked = state;
  expProductos.checked = state;
  expCultivos.checked = state;
});

/* ===========================================================
   OBTENER SELECCIÓN DEL USER
=========================================================== */
function obtenerSeleccionExportacion() {
  return {
    usuarios: expUsuarios.checked,
    gastos: expGastos.checked,
    proveedores: expProveedores.checked,
    productos: expProductos.checked,
    cultivos: expCultivos.checked
  };
}

/* ===========================================================
   CONSTRUIR URL PARA EL BACKEND
=========================================================== */
function construirUrlExport(tipo) {
  const seleccion = obtenerSeleccionExportacion();
  const params = new URLSearchParams();

  if (seleccion.usuarios) params.append("usuarios", "1");
  if (seleccion.gastos) params.append("gastos", "1");
  if (seleccion.proveedores) params.append("proveedores", "1");
  if (seleccion.productos) params.append("productos", "1");
  if (seleccion.cultivos) params.append("cultivos", "1");

  const base =
    tipo === "pdf"
      ? "http://localhost:3000/export/pdf"
      : "http://localhost:3000/export/excel";

  return `${base}?${params.toString()}`;
}

/* ===========================================================
   BOTONES EXPORTAR PDF / EXCEL
=========================================================== */

const btnExportPDF = qs("#btnExportPDF");
const btnExportExcel = qs("#btnExportExcel");

btnExportPDF?.addEventListener("click", () => {
  const url = construirUrlExport("pdf");

  if (!url.includes("?")) {
    toast("Selecciona al menos una opción para exportar", "error");
    return;
  }

  window.open(url, "_blank"); // descarga el PDF del backend
  cerrarModalExportar();
});

btnExportExcel?.addEventListener("click", () => {
  const url = construirUrlExport("excel");

  if (!url.includes("?")) {
    toast("Selecciona al menos una opción para exportar", "error");
    return;
  }

  window.open(url, "_blank"); // descarga el Excel del backend
  cerrarModalExportar();
});
