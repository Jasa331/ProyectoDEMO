// ==================== VARIABLES GLOBALES ====================
let insumos = [];
let editingId = null;

const tbody = document.getElementById("tbody");
const toast = document.getElementById("toast");
const form = document.getElementById("formAdd");
const themeToggle = document.getElementById("themeToggle");
const submitBtn = form.querySelector('button[type="submit"]');



// ==================== LOCAL STORAGE ====================
function saveToLocalStorage() {
  localStorage.setItem("insumos", JSON.stringify(insumos));
}

function loadFromLocalStorage() {
  const data = localStorage.getItem("insumos");
  if (data) insumos = JSON.parse(data);
  render();
}

// ==================== CARGAR DESDE BASE DE DATOS ====================
async function fetchInsumos() {
  try {
    const res = await fetch(`${API_URL}?action=list`);
    const data = await res.json();
    if (Array.isArray(data)) {
      insumos = data;
      saveToLocalStorage();
      render();
    } else {
      loadFromLocalStorage();
    }
  } catch (err) {
    console.error("Error al cargar insumos:", err);
    loadFromLocalStorage();
  }
}

// ==================== GUARDAR / ACTUALIZAR INSUMO ====================
async function saveInsumo(data) {
  try {
    const action = editingId ? "update" : "save";
    const bodyData = editingId ? { ...data, ID_Insumo: editingId } : data;

    const res = await fetch(`${API_URL}?action=${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    });

    const result = await res.json();

    if (result.success) {
      if (editingId) {
        const index = insumos.findIndex((i) => i.ID_Insumo === editingId);
        if (index !== -1) insumos[index] = { ...insumos[index], ...data };
        showToast("🔄 Insumo actualizado correctamente");
      } else {
        const newInsumo = { ...data, ID_Insumo: result.id || Date.now() };
        insumos.push(newInsumo);
        showToast("✅ Insumo agregado correctamente");
      }

      editingId = null;
      submitBtn.textContent = "Agregar / Actualizar";
      form.reset();
      saveToLocalStorage();
      render(true);
    } else {
      showToast("⚠️ Error al guardar en la base de datos");
    }
  } catch (error) {
    console.warn("⚠️ Error con el servidor, guardando localmente:", error);

    if (editingId) {
      const index = insumos.findIndex((i) => i.ID_Insumo === editingId);
      if (index !== -1) insumos[index] = { ...insumos[index], ...data };
    } else {
      insumos.push({ ...data, ID_Insumo: Date.now() });
    }

    editingId = null;
    submitBtn.textContent = "Agregar / Actualizar";
    form.reset();
    saveToLocalStorage();
    render();
    showToast("💾 Guardado local sin conexión");
  }
}

// ==================== ELIMINAR INSUMO ====================
async function deleteInsumo(id) {
  if (!confirm("¿Deseas eliminar este insumo?")) return;

  try {
    const res = await fetch(`${API_URL}?action=delete&id=${id}`);
    const result = await res.json();

    if (result.success) {
      insumos = insumos.filter((i) => i.ID_Insumo !== id);
      saveToLocalStorage();
      render();
      showToast("🗑️ Insumo eliminado correctamente");
    } else {
      showToast("❌ Error al eliminar en la base de datos");
    }
  } catch (err) {
    console.warn("⚠️ Error de conexión, eliminando localmente:", err);
    insumos = insumos.filter((i) => i.ID_Insumo !== id);
    saveToLocalStorage();
    render();
    showToast("💾 Eliminado localmente");
  }
}

// ==================== EDITAR INSUMO ====================
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

  submitBtn.textContent = "Actualizar Insumo";
  showToast("✏️ Modo edición activado");
}

// ==================== RENDER TABLA ====================
function render(highlightNew = false) {
  tbody.innerHTML = "";

  if (insumos.length === 0) {
    tbody.innerHTML = `
      <tr><td style="text-align:center; padding:20px; color:#888;">
        🚫 No hay insumos registrados
      </td></tr>`;
    return;
  }

  insumos.forEach((i, index) => {
    const cantidad = parseInt(i.Cantidad);
    let estado = '<span class="status ok">Bien</span>';
    if (cantidad <= 5 && cantidad > 0) estado = '<span class="status warn">Bajo</span>';
    if (cantidad === 0) estado = '<span class="status danger">Sin stock</span>';

    const tr = document.createElement("tr");
    if (highlightNew && index === insumos.length - 1) tr.classList.add("new-insumo");

    tr.innerHTML = `
      <td>${i.Nombre}</td>
      <td>${i.Tipo || "—"}</td>
      <td>${i.Descripcion || "—"}</td>
      <td>${i.Unidad_Medida || "—"}</td>
      <td>${i.Cantidad}</td>
      <td>${i.Fecha_Caducidad || "—"}</td>
      <td>${estado}</td>
      <td>
        <button class="btn" onclick="editInsumo(${i.ID_Insumo})">✏️</button>
        <br><br>
        <button class="btn" style="background:#ef4444" onclick="deleteInsumo(${i.ID_Insumo})">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ==================== TOAST ====================
function showToast(msg) {
  toast.textContent = msg;
  toast.style.display = "block";
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
    toast.style.display = "none";
  }, 2500);
}

// ==================== EVENTO SUBMIT ====================
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = {
    Nombre: document.getElementById("nombre").value.trim(),
    Tipo: document.getElementById("tipo").value.trim() || "General",
    Descripcion: document.getElementById("descripcion").value.trim() || "",
    Unidad_Medida: document.getElementById("unidad_medida").value.trim() || "kg",
    Cantidad: document.getElementById("cantidad").value,
    Fecha_Caducidad: document.getElementById("fecha_caducidad").value || "",
  };

  if (!data.Nombre || !data.Cantidad) {
    showToast("❌ Debes llenar los campos obligatorios");
    return;
  }

  saveInsumo(data);
});



// ==================== ELIMINAR INSUMO ====================
async function deleteInsumo(id) {
  if (!confirm("¿Deseas eliminar este insumo?")) return;

  // Solicitar motivo de eliminación
  const motivo = prompt("Por favor indica el motivo de la eliminación del insumo:");
  if (!motivo || motivo.trim() === "") {
    showToast("⚠️ Eliminación cancelada: debes indicar un motivo.");
    return;
  }

  try {
    const res = await fetch(`${API_URL}?action=delete&id=${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivo }),
    });
    const result = await res.json();

    if (result.success) {
      insumos = insumos.filter((i) => i.ID_Insumo !== id);
      saveToLocalStorage();
      render();
      showToast(`🗑️ Insumo eliminado. Motivo: ${motivo}`);
      console.log("📝 Motivo de eliminación:", motivo);
    } else {
      showToast("❌ Error al eliminar en la base de datos");
    }
  } catch (err) {
    console.warn("⚠️ Error de conexión, eliminando localmente:", err);
    insumos = insumos.filter((i) => i.ID_Insumo !== id);
    saveToLocalStorage();
    render();
    showToast(`💾 Eliminado localmente. Motivo: ${motivo}`);
    console.log("📝 Motivo de eliminación (local):", motivo);
  }
}


// ==================== MODO OSCURO/CLARO ====================
themeToggle.addEventListener("click", () => {
  const theme = document.body.getAttribute("data-theme");
  const newTheme = theme === "dark" ? "light" : "dark";
  document.body.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
});

// ==================== INICIO ====================
window.addEventListener("load", () => {
  document.body.setAttribute("data-theme", localStorage.getItem("theme") || "light");
  fetchInsumos();
});
