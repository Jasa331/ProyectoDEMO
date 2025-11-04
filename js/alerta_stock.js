// ================================
// 🔔 TOAST MENSAJES
// ================================
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}


// ================================
// 🔗 CONFIGURACIÓN DE API
// ================================
const API_URL = "http://localhost:3000/insumo"; // Puerto del backend Express

// ================================
// 📋 MANEJO DEL FORMULARIO
// ================================
document.getElementById("formAdd").addEventListener("submit", async (e) => {
  e.preventDefault();

  const insumo = {
    Nombre: document.getElementById("nombre").value,
    Tipo: document.getElementById("tipo").value,
    Descripcion: document.getElementById("descripcion").value,
    Unidad_Medida: document.getElementById("unidad_medida").value,
    Cantidad: document.getElementById("cantidad").value,
    Fecha_Caducidad: document.getElementById("fecha_caducidad").value || null,
    Fecha_Registro: new Date().toISOString().slice(0, 19).replace("T", " "),
    ID_Ingreso_Insumo: null,
    ID_Usuario: null,
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(insumo),
    });

    const result = await response.json();
    if (result.ok) {
      showToast("✅ Insumo agregado correctamente");
      document.getElementById("formAdd").reset();
      obtenerInsumos();
    } else {
      showToast("⚠️ Error al agregar insumo: " + result.error);
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
    const res = await fetch("http://localhost:3000/insumos"); // También puerto 5000
    const data = await res.json();

    const tbody = document.getElementById("tbody");
    tbody.innerHTML = "";

    data.forEach((item) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${item.Nombre}</td>`;
      tbody.appendChild(row);
    });
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
