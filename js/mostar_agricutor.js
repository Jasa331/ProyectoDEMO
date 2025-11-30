// Mostrar una sección y ocultar las demás
function mostrarSeccion(id) {
  // Caso especial: cerrar sesión
  if (id === "cerrarSesion") {
    localStorage.clear();
    sessionStorage.clear();
    ocultarTodas();

    const cerrarDiv = document.getElementById("cerrarSesion");
    if (cerrarDiv) {
      cerrarDiv.style.display = "block";
      cerrarDiv.innerHTML = "<h1>Cerrando sesión...</h1><p>Redirigiendo al inicio...</p>";
    }

    setTimeout(() => {
      window.location.href = "../HTML/index_Inicio.html";
    }, 1000);
    return;
  }

  // Mostrar la sección seleccionada
  ocultarTodas();
  const seccion = document.getElementById(id);
  if (seccion) {
    seccion.style.display = "block";

    // Cargar perfil al mostrar la sección perfil
    if (id === "perfil") {
      cargarPerfil();
    }
  } else {
    console.warn(`⚠ La sección ${id} no existe en el HTML`);
  }
}

// Oculta todas las secciones
function ocultarTodas() {
  const secciones = document.querySelectorAll(".seccion");
  secciones.forEach(sec => sec.style.display = "none");
}

// Hacer accesible la función desde el HTML (onclick)
window.mostrarSeccion = mostrarSeccion;


// ==============================
// EVENTOS ESPECIALES
// ==============================

// Activar eventos por sección (opcional)
function activarEventos(id) {
  if (id === "reportes") {
    console.log("Mostrando reportes del empleado...");
  }
  if (id === "inventario") {
    console.log("Mostrando inventario del empleado...");
  }
}


// ==============================
// CONTROL DE SESIÓN
// ==============================

document.addEventListener("DOMContentLoaded", () => {
  // Compatibilidad: comprobar "user" o "usuarioActivo"
  const usuarioActivo = localStorage.getItem("user") || localStorage.getItem("usuarioActivo");
  if (!usuarioActivo) {
    alert("Debes iniciar sesión primero");
    window.location.href = "../HTML/index_login.html";
    return;
  }

  const datos = JSON.parse(usuarioActivo);
  const nombre = datos?.Usuario_Nombre || datos?.Nombre || datos?.nombre || "Usuario";

  const saludo = document.createElement("div");
  saludo.className = "saludo-panel";
  saludo.textContent = `HOLA ${nombre}, bienvenido al panel de Agricultor.`;

  const content = document.querySelector(".content");
  if (content) content.prepend(saludo);

  mostrarSeccion("dashboard");
});



// ==============================
// CAMBIO DE TEMA (modo claro/oscuro)
// ==============================

const btnFlotante2 = document.getElementById("btnFlotante2");
if (btnFlotante2) {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  btnFlotante2.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  });
}


// ==============================
// UTILIDAD EXTRA (formato de tiempo)
// ==============================

function formatearTiempo(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  return `${h}h ${m}m ${s}s`;
}

async function cargarPerfil() {
  const data = localStorage.getItem("user") || localStorage.getItem("usuarioActivo");
  if (!data) {
    console.warn("cargarPerfil: no hay usuario en localStorage");
    return;
  }

  let userLocal;
  try {
    userLocal = JSON.parse(data);
  } catch (e) {
    console.error("cargarPerfil: JSON inválido en localStorage 'user':", e);
    return;
  }

  const id = userLocal.ID_Usuario;
  if (!id) {
    console.warn("cargarPerfil: falta ID_Usuario en el objeto user");
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/perfil/${id}`);
    if (!res.ok) {
      console.error("cargarPerfil: respuesta HTTP no OK", res.status, res.statusText);
      return;
    }

    const result = await res.json();
    if (!result.ok) {
      console.error("cargarPerfil: API devolvió error:", result.error);
      return;
    }

    const user = result.usuario || result.user;
    if (!user) {
      console.error("cargarPerfil: respuesta no contiene usuario");
      return;
    }

    const setText = (idEl, value) => {
      const el = document.getElementById(idEl);
      if (el) el.textContent = value ?? "";
    };

    setText("p_nombre", user.Usuario_Nombre || user.Usuario_Nombre || "");
    setText("p_apellido", user.Usuario_Apellido || "");
    setText("p_correo", user.Correo || user.correo || "");
    setText("p_telefono", user.Telefono || user.telefono || "");
    setText("p_direccion", user.Direccion || user.direccion || "");
    setText("p_rol", user.Rol || user.rol || "");

  } catch (error) {
    console.error("Error llamando al backend en cargarPerfil:", error);
  }
}
