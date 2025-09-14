// ===== Claves de almacenamiento =====
const KEY = "usuarios";
const KEY_SESSION = "usuarioActivo";

const qs = sel => document.querySelector(sel);
const qsa = sel => [...document.querySelectorAll(sel)];

// ===== Utilidades para LocalStorage =====
function readUsers() {
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}
function writeUsers(arr) {
  localStorage.setItem(KEY, JSON.stringify(arr));
}

// ===== Control de acceso (solo admin) =====
(function guard() {
  const activo = JSON.parse(localStorage.getItem(KEY_SESSION) || "null");
  if (!activo || activo.perfil !== "admin") {
    location.href = "index.html"; // Redirige al inicio si no es admin
  }
})();

// ===== Estado =====
let usuarios = readUsers();
let filtro = ""; // texto de búsqueda
let editIndex = null; // null = creando

// Semilla de datos inicial si no hay usuarios registrados
if (usuarios.length === 0) {
  usuarios = [
    { nombre: "Ana", apellido: "Campos", usuario: "ana", correo: "ana@demo.com", direccion: "", telefono: "", perfil: "admin", password: "1234" },
    { nombre: "Luis", apellido: "Mora", usuario: "lmora", correo: "luis@demo.com", direccion: "", telefono: "", perfil: "usuario", password: "abcd" }
  ];
  writeUsers(usuarios);
}

// ===== Referencias del DOM =====
const tbody = qs("#tbodyUsuarios");
const vacio = qs("#vacio");

// ===== Render de estadísticas =====
function renderStats() {
  const total = usuarios.length;
  const admins = usuarios.filter(u => u.perfil === "admin").length;
  qs("#statTotal").textContent = total;
  qs("#statAdmins").textContent = admins;
  qs("#statUsuarios").textContent = total - admins;
}

// ===== Render de la tabla =====
function renderTable() {
  const term = filtro.trim().toLowerCase();
  const data = usuarios.filter(u =>
    [u.nombre, u.apellido, u.usuario, u.correo, u.perfil]
      .some(v => String(v || "").toLowerCase().includes(term))
  );

  tbody.innerHTML = "";
  data.forEach((u, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.nombre} ${u.apellido ?? ""}</td>
      <td>${u.usuario}</td>
      <td>${u.correo}</td>
      <td>${u.perfil}</td>
      <td>
        <div class="actions">
          <button class="action edit" data-i="${i}" data-id="${u.usuario}">Editar</button>
          <button class="action del" data-i="${i}" data-id="${u.usuario}">Eliminar</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  vacio.style.display = data.length ? "none" : "block";
  renderStats();
}

// ===== Búsqueda =====
qs("#inputBuscar").addEventListener("input", e => {
  filtro = e.target.value;
  renderTable();
});

// ===== Modal Crear / Editar =====
const modal = qs("#modal");
const form = qs("#formUsuario");
const modalTitle = qs("#modalTitle");
const btnNuevo = qs("#btnNuevo");
const btnCancelar = qs("#btnCancelar");
const btnCerrarModal = qs("#btnCerrarModal");

function openModal(modo, index = null) {
  editIndex = index;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  if (modo === "crear") {
    modalTitle.textContent = "Nuevo usuario";
    form.reset();
  } else {
    modalTitle.textContent = "Editar usuario";
    const u = usuarios[index];
    form.nombre.value = u.nombre || "";
    form.apellido.value = u.apellido || "";
    form.usuario.value = u.usuario || "";
    form.correo.value = u.correo || "";
    form.direccion.value = u.direccion || "";
    form.telefono.value = u.telefono || "";
    form.perfil.value = u.perfil || "usuario";
    form.password.value = u.password || "";
  }
  setTimeout(() => form.nombre.focus(), 50);
}

function closeModal() {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

btnNuevo.addEventListener("click", () => openModal("crear"));
btnCancelar.addEventListener("click", closeModal);
btnCerrarModal.addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

// Guardar usuario (crear/editar)
form.addEventListener("submit", e => {
  e.preventDefault();

  const nuevo = {
    nombre: form.nombre.value.trim(),
    apellido: form.apellido.value.trim(),
    usuario: form.usuario.value.trim(),
    correo: form.correo.value.trim(),
    direccion: form.direccion.value.trim(),
    telefono: form.telefono.value.trim(),
    perfil: form.perfil.value,
    password: form.password.value
  };

  if (!nuevo.nombre || !nuevo.usuario || !nuevo.correo || !nuevo.password) {
    return toast("Completa los campos obligatorios.");
  }

  if (editIndex === null) {
    const existe = usuarios.some(u => u.usuario === nuevo.usuario || u.correo === nuevo.correo);
    if (existe) return toast("Ya existe un usuario con ese usuario o correo.");
    usuarios.push(nuevo);
    toast("Usuario creado ✅");
  } else {
    const choque = usuarios.some((u, idx) => idx !== editIndex && (u.usuario === nuevo.usuario || u.correo === nuevo.correo));
    if (choque) return toast("Usuario o correo ya están siendo usados por otro registro.");
    usuarios[editIndex] = nuevo;
    toast("Cambios guardados 💾");
  }

  writeUsers(usuarios);
  closeModal();
  renderTable();
});

// Acciones de la tabla (editar / eliminar)
tbody.addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const indexEnFiltrado = Number(btn.dataset.i);
  const term = filtro.trim().toLowerCase();
  const visibles = usuarios
    .map((u, i) => ({ u, i }))
    .filter(o => [o.u.nombre, o.u.apellido, o.u.usuario, o.u.correo, o.u.perfil]
      .some(v => String(v || "").toLowerCase().includes(term)));

  const realIndex = visibles[indexEnFiltrado]?.i;
  if (realIndex == null) return;

  if (btn.classList.contains("edit")) {
    openModal("editar", realIndex);
  } else if (btn.classList.contains("del")) {
    const u = usuarios[realIndex];
    if (confirm(`¿Eliminar a "${u.nombre} (${u.usuario})"?`)) {
      usuarios.splice(realIndex, 1);
      writeUsers(usuarios);
      renderTable();
      toast("Usuario eliminado 🗑️");
    }
  }
});

// ===== Cerrar sesión =====
qs("#btnLogout").addEventListener("click", () => {
  localStorage.removeItem(KEY_SESSION);
  location.href = "../HTML/index_inicio.html"; 
});

// ===== Toast =====
const toastBox = qs("#toast");
let toastTimer = null;
function toast(msg) {
  toastBox.textContent = msg;
  toastBox.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastBox.classList.remove("show"), 2200);
}

// ===== Inicial =====
renderTable();
