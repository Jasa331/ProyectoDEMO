// ============================ UTILIDADES ============================
const qs = sel => document.querySelector(sel);
const tbody = qs("#tbodyUsuarios");
const vacio = qs("#vacio");
const modal = qs("#modal");
const form = qs("#formUsuario");
const modalTitle = qs("#modalTitle");
const toastBox = qs("#toast");
const themeToggle = qs("#themeToggle"); // <-- botón del modo oscuro/claro

let editId = null;
let filtro = "";
let toastTimer = null;

// ============================ TOAST ============================
function toast(msg, tipo = "info") {
  toastBox.textContent = msg;
  toastBox.className = `toast show ${tipo}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastBox.classList.remove("show"), 2500);
}

// ============================ FETCH API ============================
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

// ============================ RENDERIZAR TABLA ============================
async function renderTable() {
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

  vacio.style.display = filtrados.length ? "none" : "block";
  renderStats(usuarios);
}

// ============================ ESTADÍSTICAS ============================
function renderStats(usuarios) {
  const total = usuarios.length;
  const admins = usuarios.filter(u => u.Rol === "Administrador").length;
  qs("#statTotal").textContent = total;
  qs("#statAdmins").textContent = admins;
  qs("#statUsuarios").textContent = total - admins;
}

// ============================ BÚSQUEDA ============================
qs("#inputBuscar").addEventListener("input", e => {
  filtro = e.target.value;
  renderTable();
});

// ============================ MODAL ============================
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
  form.password.value = "";

  form.perfil.innerHTML = `
    <option value="Empleado" ${usuario.Rol === "Empleado" ? "selected" : ""}>Empleado</option>
    <option value="Agricultor" ${usuario.Rol === "Agricultor" ? "selected" : ""}>Agricultor</option>
    <option value="Administrador" ${usuario.Rol === "Administrador" ? "selected" : ""}>Administrador</option>
  `;
}

function closeModal() { modal.classList.remove("show"); }

qs("#btnNuevo").addEventListener("click", () => openModal(false));
qs("#btnCancelar").addEventListener("click", closeModal);
qs("#btnCerrarModal").addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

// ============================ GUARDAR USUARIO ============================
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

// ============================ ACCIONES TABLA ============================
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

// ============================ BOTONES ADICIONALES ============================
qs("#btnRefrescar").addEventListener("click", renderTable);
qs("#btnVerUsuarios").addEventListener("click", renderTable);
qs("#btnExportar").addEventListener("click", () => toast("Exportando datos… 📄"));
qs("#btnConfiguracion").addEventListener("click", () => toast("Configuración abierta ⚙️"));
qs("#btnSoporte").addEventListener("click", () => toast("Contactando soporte 📞"));
qs("#btnLogout").addEventListener("click", () => toast("Cerrando sesión 👋"));

// ==================== MODO CLARO / OSCURO ====================

const currentTheme = localStorage.getItem("theme") || "light";

document.documentElement.setAttribute("data-theme", currentTheme);
themeToggle.innerHTML = currentTheme === "dark" ? "🌙" : "🌞";

themeToggle.addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const newTheme = isDark ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  themeToggle.innerHTML = newTheme === "dark" ? "🌙" : "🌞";
});


// ============================ INICIALIZAR ============================
initTheme();
renderTable();


