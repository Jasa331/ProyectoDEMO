// =============================
// CREAR / ACTUALIZAR PRODUCTO
// =============================
document.getElementById("formProducto").addEventListener("submit", async (e) => {
  e.preventDefault();

  const producto = {
    Nombre: document.getElementById("Nombre").value.trim(),
    Stock: document.getElementById("Stock").value,
    Precio: document.getElementById("Precio").value,
    ID_Usuario: localStorage.getItem("ID_Usuario") || 1,
  };

  const id = document.getElementById("ID_Producto").value;
  const url = id ? `http://localhost:3000/producto/${id}` : `http://localhost:3000/producto`;
  const method = id ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(producto),
    });

    const data = await res.json();
    document.getElementById("mensaje").textContent =
      data.ok ? "Producto guardado correctamente" : "Error al guardar el producto";

    document.getElementById("formProducto").reset();
    document.getElementById("ID_Producto").value = "";
    cargarProductos();
  } catch (err) {
    console.error("Error al guardar producto:", err);
    document.getElementById("mensaje").textContent = "Error de conexión con el servidor";
  }
});

// =============================
// CARGAR PRODUCTOS
// =============================
async function cargarProductos() {
  try {
    const res = await fetch("http://localhost:3000/producto");
    if (!res.ok) throw new Error("Error al obtener datos");
    const data = await res.json();

    const tbody = document.querySelector("#tablaProductos tbody");
    tbody.innerHTML = "";

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">No hay productos registrados</td></tr>`;
      return;
    }

    data.forEach((p) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${p.ID_Producto}</td>
        <td>${p.Nombre}</td>
        <td>${p.Stock}</td>
        <td>${p.Precio}</td>
        <td>
          <button onclick="editarProducto(${p.ID_Producto})">✏️</button>
          <button onclick="eliminarProducto(${p.ID_Producto})">🗑️</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Error cargando productos:", err);
  }
}

// =============================
// EDITAR PRODUCTO
// =============================
async function editarProducto(id) {
  try {
    const res = await fetch(`http://localhost:3000/producto/${id}`);
    const p = await res.json();

    document.getElementById("ID_Producto").value = p.ID_Producto;
    document.getElementById("Nombre").value = p.Nombre;
    document.getElementById("Stock").value = p.Stock;
    document.getElementById("Precio").value = p.Precio;
  } catch (err) {
    console.error("Error al editar:", err);
  }
}

// =============================
// ELIMINAR PRODUCTO
// =============================
async function eliminarProducto(id) {
  if (!confirm("¿Eliminar producto?")) return;

  try {
    await fetch(`http://localhost:3000/producto/${id}`, {
      method: "DELETE",
    });

    cargarProductos();
  } catch (err) {
    console.error("Error al eliminar:", err);
  }
}

// =============================
// INICIO
// =============================
window.addEventListener("DOMContentLoaded", cargarProductos);


// ====================================================
// MODO OSCURO / CLARO
// ====================================================
const themeToggle = document.getElementById("themeToggle");
const body = document.body;

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
  body.setAttribute("data-theme", "dark");
  themeToggle.textContent = "☀️";
} else {
  body.removeAttribute("data-theme");
  themeToggle.textContent = "🌙";
}

themeToggle.addEventListener("click", () => {
  const isDark = body.getAttribute("data-theme") === "dark";

  if (isDark) {
    body.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");
    themeToggle.textContent = "🌙";
  } else {
    body.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
    themeToggle.textContent = "☀️";
  }
});


