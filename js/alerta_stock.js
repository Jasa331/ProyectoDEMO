// ================================
// 🔔 TOAST MENSAJES
// ================================
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

// ================================
// 🔗 CONFIGURACIÓN DE API
// ================================
const API_URL = "http://localhost:3000/insumos"; 

let insumos = [];
let editingId = null;

// ================================
// 📋 FORMULARIO
// ================================
const form = document.getElementById("formAdd");
const cancelBtn = document.getElementById("cancelBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = "Bearer " + token;

  const insumo = {
    Nombre: document.getElementById("nombre").value.trim(),
    Tipo: document.getElementById("tipo").value.trim() || "General",
    Descripcion: document.getElementById("descripcion").value.trim() || "",
    Unidad_Medida: document.getElementById("unidad_medida").value.trim() || "kg",
    Cantidad: parseInt(document.getElementById("cantidad").value, 10) || 0,
    Fecha_Caducidad: document.getElementById("fecha_caducidad").value || null,
    Fecha_Registro: new Date().toISOString().slice(0,19).replace('T',' '),
    ID_Ingreso_Insumo: null
  };

  try {
    const url = editingId ? `http://localhost:3000/insumo/${editingId}` : "http://localhost:3000/insumo";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(insumo)
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Error al guardar insumo:", data);
      showToast(data.error || "Error al guardar insumo");
      return;
    }

    showToast(editingId ? "Insumo actualizado" : "Insumo agregado");
    resetForm();

  } catch (err) {
    console.error("Fetch error:", err);
    showToast("❌ Error de conexión con el servidor");
  }
});

if (cancelBtn) {
  cancelBtn.addEventListener("click", () => {
    resetForm();
    showToast("Edición cancelada");
  });
}

function resetForm() {
  form.reset();
  editingId = null;
  if (cancelBtn) cancelBtn.style.display = "none";
  obtenerInsumos();
}

// ================================
// 📦 OBTENER LISTA DE INSUMOS (CORREGIDO)
// ================================
async function obtenerInsumos() {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(API_URL, {
      headers: { "Authorization": "Bearer " + token }
    });

    const data = await res.json();
    insumos = data;
    render();
  } catch (err) {
    console.error("Error al obtener insumos:", err);
    showToast("⚠ No se pudo obtener el listado");
  }
}

// ================================
// ✏️ EDITAR INSUMO
// ================================
window.editInsumo = function(id) {
  const insumo = insumos.find((i) => i.ID_Insumo === id);
  if (!insumo) return;

  editingId = id;

  document.getElementById("nombre").value = insumo.Nombre;
  document.getElementById("tipo").value = insumo.Tipo;
  document.getElementById("descripcion").value = insumo.Descripcion;
  document.getElementById("unidad_medida").value = insumo.Unidad_Medida;
  document.getElementById("cantidad").value = insumo.Cantidad;
  document.getElementById("fecha_caducidad").value =
    insumo.Fecha_Caducidad || "";

  if (cancelBtn) cancelBtn.style.display = "inline-block";
  showToast("✏️ Modo edición activado");
};

// ================================
// 🗑️ ELIMINAR INSUMO (CORREGIDO)
// ================================
window.deleteInsumo = async function(id) {
  if (!confirm("¿Eliminar este insumo?")) return;

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`http://localhost:3000/insumo/${id}`, {
      method: "DELETE",
      headers: { "Authorization": "Bearer " + token }
    });

    const result = await response.json();

    if (result.ok) {
      showToast("🗑️ Insumo eliminado");
      obtenerInsumos();
    } else {
      showToast("⚠ Error al eliminar insumo");
    }
  } catch (err) {
    console.error("Error al eliminar insumo:", err);
    showToast("❌ No se pudo eliminar");
  }
};

// ================================
// 🧾 RENDERIZAR TABLA
// ================================
function render() {
  const tbody = document.getElementById("tbody");
  tbody.innerHTML = "";

  if (!insumos.length) {
    tbody.innerHTML = `
      <tr><td colspan="7" style="text-align:center;">🚫 No hay insumos</td></tr>`;
    return;
  }

  insumos.forEach((i) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${i.Nombre}</td>
      <td>${i.Tipo || "—"}</td>
      <td>${i.Descripcion || "—"}</td>
      <td>${i.Unidad_Medida || "—"}</td>
      <td>${i.Cantidad}</td>
      <td>${i.Fecha_Caducidad || "—"}</td>
      <td>
        <button class="btn" onclick="editInsumo(${i.ID_Insumo})">✏️</button>
        <button class="btn" style="background:#ef4444" onclick="deleteInsumo(${i.ID_Insumo})">🗑️</button>
      </td>`;
    
    tbody.appendChild(tr);
  });
}

// ================================
// 🌙 MODO OSCURO / CLARO
// ================================
const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("click", () => {
  const current = document.body.getAttribute("data-theme");
  const newTheme = current === "dark" ? "light" : "dark";
  document.body.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
});

// ================================
// 🚀 INICIO
// ================================
window.addEventListener("load", () => {
  if (cancelBtn) cancelBtn.style.display = "none";
  document.body.setAttribute("data-theme", localStorage.getItem("theme") || "light");
  obtenerInsumos();
});
