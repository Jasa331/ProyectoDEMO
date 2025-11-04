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
const API_URL = "http://localhost:3000/insumo"; 
const API_URL_GET = "http://localhost:3000/insumos";

let insumos = [];
let editingId = null;

// ================================
// 📋 MANEJO DEL FORMULARIO
// ================================
const form = document.getElementById("formAdd");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const insumo = {
    Nombre: document.getElementById("nombre").value.trim(),
    Tipo: document.getElementById("tipo").value.trim() || "General",
    Descripcion: document.getElementById("descripcion").value.trim() || "",
    Unidad_Medida: document.getElementById("unidad_medida").value.trim() || "kg",
    Cantidad: parseInt(document.getElementById("cantidad").value) || 0,
    Fecha_Caducidad: document.getElementById("fecha_caducidad").value || null,
    Fecha_Registro: new Date().toISOString().slice(0, 19).replace("T", " "),
    ID_Ingreso_Insumo: null,
    ID_Usuario: null,
  };

  try {
    if (editingId) {
      // EDITAR INSUMO EXISTENTE
      const response = await fetch(`${API_URL}/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(insumo),
      });
      const result = await response.json();
      if (result.ok) {
        showToast("✏️ Insumo actualizado");
        editingId = null;
        form.reset();
        obtenerInsumos();
      } else {
        showToast("⚠️ Error al actualizar insumo");
      }
    } else {
      // AGREGAR NUEVO INSUMO
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(insumo),
      });
      const result = await response.json();
      if (result.ok) {
        showToast("✅ Insumo agregado correctamente");
        form.reset();
        obtenerInsumos();
      } else {
        showToast("⚠️ Error al agregar insumo");
      }
    }
  } catch (error) {
    console.error("Error al enviar insumo:", error);
    showToast("❌ Error de conexión con el servidor");
  }
});

// ================================
// 📦 OBTENER LISTA DE INSUMOS
// ================================
async function obtenerInsumos() {
  try {
    const res = await fetch(API_URL_GET);
    const data = await res.json();
    insumos = data;
    render();
  } catch (err) {
    console.error("Error al obtener insumos:", err);
    showToast("⚠️ No se pudo obtener el listado");
  }
}

// ================================
// ✏️ EDITAR INSUMO
// ================================
function editInsumo(id) {
  const insumo = insumos.find((i) => i.ID_Insumo === id);
  if (!insumo) return;

  editingId = id;
  document.getElementById("nombre").value = insumo.Nombre;
  document.getElementById("tipo").value = insumo.Tipo;
  document.getElementById("descripcion").value = insumo.Descripcion;
  document.getElementById("unidad_medida").value = insumo.Unidad_Medida;
  document.getElementById("cantidad").value = insumo.Cantidad;
  document.getElementById("fecha_caducidad").value = insumo.Fecha_Caducidad || "";

  showToast("✏️ Modo edición activado");
}

// ================================
// 🗑️ ELIMINAR INSUMO
// ================================
async function deleteInsumo(id) {
  if (!confirm("¿Eliminar este insumo?")) return;

  try {
    const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    const result = await response.json();
    if (result.ok) {
      showToast("🗑️ Insumo eliminado");
      obtenerInsumos();
    } else {
      showToast("⚠️ Error al eliminar insumo");
    }
  } catch (err) {
    console.error("Error al eliminar insumo:", err);
    showToast("❌ No se pudo eliminar");
  }
}

// ================================
// 🧾 RENDERIZAR TABLA
// ================================
function render() {
  const tbody = document.getElementById("tbody");
  tbody.innerHTML = "";

  if (!insumos.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">🚫 No hay insumos</td></tr>`;
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
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ================================
// 🌙/☀️ MODO OSCURO / CLARO
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
  document.body.setAttribute("data-theme", localStorage.getItem("theme") || "light");
  obtenerInsumos();
});
