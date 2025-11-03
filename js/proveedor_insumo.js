document.getElementById("formProveedor").addEventListener("submit", async (e) => {
  e.preventDefault();

  const proveedor = {
    Ciudad: document.getElementById("ciudad").value,
    Telefono: document.getElementById("telefono").value,
    Direccion: document.getElementById("direccion").value,
    Nombre_Empresa: document.getElementById("empresa").value,
    Nombre_Contacto: document.getElementById("contacto").value,
    Region: document.getElementById("region").value,
    Cod_Postal: document.getElementById("codPostal").value,
    ID_Ingreso_Insumo: document.getElementById("id_ingreso").value,
  };

  try {
    const res = await fetch("http://localhost:3000/proveedor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proveedor),
    });

    const data = await res.json();
    document.getElementById("mensaje").textContent = data.ok
      ? "✅ Proveedor registrado correctamente"
      : "❌ Error al registrar proveedor";
  } catch (err) {
    document.getElementById("mensaje").textContent = "❌ Error de conexión con el servidor";
    console.error(err);
  }
});
// ==================== MODO CLARO / OSCURO ====================
const themeToggle = document.getElementById("themeToggle");
const body = document.body;

// Verifica si hay un tema guardado en localStorage
const savedTheme = localStorage.getItem("theme");

// Si hay un tema guardado, lo aplica
if (savedTheme === "dark") {
  body.setAttribute("data-theme", "dark");
  themeToggle.textContent = "☀️"; // Ícono de sol para volver a claro
} else {
  body.removeAttribute("data-theme");
  themeToggle.textContent = "🌙"; // Ícono de luna para pasar a oscuro
}

// Cambiar tema al hacer clic
themeToggle.addEventListener("click", () => {
  const isDark = body.getAttribute("data-theme") === "dark";

  if (isDark) {
    // Cambiar a modo claro
    body.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");
    themeToggle.textContent = "🌙";
  } else {
    // Cambiar a modo oscuro
    body.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
    themeToggle.textContent = "☀️";
  }
});
