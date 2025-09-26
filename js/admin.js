const qs = sel => document.querySelector(sel);
const tbody = qs("#tbodyUsuarios");
const vacio = qs("#vacio");
const modal = qs("#modal");
const form = qs("#formUsuario");
const modalTitle = qs("#modalTitle");
let editId = null;
let filtro = "";

// ===== Toast =====
const toastBox = qs("#toast");
let toastTimer = null;
function toast(msg) {
  toastBox.textContent = msg;
  toastBox.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastBox.classList.remove("show"), 2200);
}

// ===== Fetch usuarios =====
async function fetchUsuarios() {
  try {
    const res = await fetch("http://localhost:3000/usuarios");
    if (!res.ok) throw new Error("Error al cargar usuarios");
    return await res.json();
  } catch (err) {
    toast(err.message);
    return [];
  }
}

// ===== Render tabla =====
async function renderTable() {
  const usuarios = await fetchUsuarios();
  const term = filtro.trim().toLowerCase();
  const data = usuarios.filter(u =>
    [u.Usuario_Nombre, u.Usuario_Apellido, u.Correo, u.Rol]
      .some(v => String(v || "").toLowerCase().includes(term))
  );

  tbody.innerHTML = "";
  data.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.Usuario_Nombre} ${u.Usuario_Apellido}</td>
      <td>${u.Correo}</td>
      <td>${u.Rol}</td>
      <td>
        <div class="actions">
          <button class="action edit" data-id="${u.ID_Usuario}">Editar</button>
          <button class="action del" data-id="${u.ID_Usuario}">Eliminar</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  vacio.style.display = data.length ? "none" : "block";
  renderStats(usuarios);
}

// ===== Render stats =====
function renderStats(usuarios) {
  const total = usuarios.length;
  const admins = usuarios.filter(u => u.Rol === "Administrador").length;
  qs("#statTotal").textContent = total;
  qs("#statAdmins").textContent = admins;
  qs("#statUsuarios").textContent = total - admins;
}

// ===== Búsqueda =====
qs("#inputBuscar").addEventListener("input", e => {
  filtro = e.target.value;
  renderTable();
});

// ===== Modal =====
function openModal(edit = false, usuario = {}) {
  editId = edit ? usuario.ID_Usuario : null;
  modal.classList.add("show");
  modalTitle.textContent = edit ? "Editar usuario" : "Nuevo usuario";

  form.nombre.value = usuario.Usuario_Nombre || "";
  form.apellido.value = usuario.Usuario_Apellido || "";
  form.correo.value = usuario.Correo || "";
  form.direccion.value = usuario.Direccion || "";
  form.telefono.value = usuario.Telefono || "";
  form.password.value = "";

  if (edit) {
    // Al editar, mostrar el rol actual (puede ser Administrador)
    form.perfil.innerHTML = `
      <option value="Empleado" ${usuario.Rol === "Empleado" ? "selected" : ""}>Empleado</option>
      <option value="Agricultor" ${usuario.Rol === "Agricultor" ? "selected" : ""}>Agricultor</option>
      <option value="Administrador" ${usuario.Rol === "Administrador" ? "selected" : ""}>Administrador</option>
    `;
  } else {
    // Nuevo usuario: solo Empleado o Agricultor
    form.perfil.value = "Empleado";
    form.perfil.innerHTML = `
      <option value="Empleado">Empleado</option>
      <option value="Agricultor">Agricultor</option>
    `;
  }
}

function closeModal() { modal.classList.remove("show"); }
qs("#btnNuevo").addEventListener("click", () => openModal(false));
qs("#btnCancelar").addEventListener("click", closeModal);
qs("#btnCerrarModal").addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

// ===== Guardar usuario =====
form.addEventListener("submit", async e => {
  e.preventDefault();
  const payload = {
    Usuario_Nombre: form.nombre.value.trim(),
    Usuario_Apellido: form.apellido.value.trim(),
    Correo: form.correo.value.trim(),
    Rol: form.perfil.value,
    Direccion: form.direccion.value.trim(),
    Telefono: form.telefono.value.trim(),
    Contrasena: form.password.value.trim()
  };

  try {
    let res, data;
    if (editId) {
      res = await fetch(`http://localhost:3000/usuarios/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar usuario");
      toast("Usuario actualizado 💾");
    } else {
      res = await fetch("http://localhost:3000/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear usuario");
      toast("Usuario creado ✅");
    }
    closeModal();
    renderTable();
  } catch (err) {
    toast(err.message);
  }
});

// ===== Acciones tabla =====
tbody.addEventListener("click", async e => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const id = btn.dataset.id;

  if (btn.classList.contains("edit")) {
    const usuarios = await fetchUsuarios();
    const usuario = usuarios.find(u => u.ID_Usuario == id);
    openModal(true, usuario);
  } else if (btn.classList.contains("del")) {
    if (!confirm("¿Eliminar usuario?")) return;
    try {
      const res = await fetch(`http://localhost:3000/usuarios/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar usuario");
      toast("Usuario eliminado 🗑️");
      renderTable();
    } catch (err) {
      toast(err.message);
    }
  }
});

// ===== Inicial =====
renderTable();
