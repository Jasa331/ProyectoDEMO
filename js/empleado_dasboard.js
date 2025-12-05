// ==============================
// FUNCIONES PRINCIPALES
// ==============================

// Mostrar una sección y ocultar las demás
function mostrarSeccion(id) {
  if (id === "cerrarSesion") {
    localStorage.clear();
    sessionStorage.clear();
    ocultarTodas();

    const cerrarDiv = document.getElementById("cerrarSesion");
    if (cerrarDiv) {
      cerrarDiv.classList.add("activa");
      cerrarDiv.innerHTML = "<h1>Cerrando sesión...</h1><p>Redirigiendo al inicio...</p>";
    }

    setTimeout(() => {
      window.location.href = "../HTML/index_Inicio.html";
    }, 1000);

    return;
  }

  ocultarTodas();

  const seccion = document.getElementById(id);
  if (seccion) {
    seccion.classList.add("activa");

    // ============ CARGAR PERFIL AL MOSTRAR PERFIL ============
    if (id === "perfil") {
      cargarPerfil();
    }
  }
}

// Ocultar todas las secciones
function ocultarTodas() {
  document.querySelectorAll(".seccion").forEach(sec => sec.classList.remove("activa"));
}

window.mostrarSeccion = mostrarSeccion;


// ==============================
// CONTROL DE SESIÓN
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const rawUser = localStorage.getItem("user");

  if (!rawUser) {
    alert("Debes iniciar sesión primero");
    window.location.href = "../HTML/index_login.html";
    return;
  }

  let datos = {};
  try {
    datos = JSON.parse(rawUser);
  } catch (e) {
    console.error("Error leyendo usuario:", e);
    window.location.href = "../HTML/index_login.html";
    return;
  }

  const nombre = datos?.Usuario_Nombre || "Empleado";

  // Crear saludo
  const saludo = document.createElement("div");
  saludo.className = "saludo-panel";
  saludo.textContent = `HOLA ${nombre.toUpperCase()}, bienvenido al panel de EMPLEADO.`;

  const content = document.querySelector(".content");
  if (content) content.prepend(saludo);

  mostrarSeccion("dashboard");
});


// ==============================
// CAMBIO DE TEMA
// ==============================
const btnFlotante2 = document.getElementById("btnFlotante2");
if (btnFlotante2) {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  btnFlotante2.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });
}


// ==============================
// CARGAR PERFIL DEL EMPLEADO
// ==============================
async function cargarPerfil() {
  console.log("=== CARGANDO PERFIL ===");

  const raw = localStorage.getItem("user");
  if (!raw) {
    console.error("No existe localStorage.user");
    return;
  }

  let userLocal;
  try {
    userLocal = JSON.parse(raw);
  } catch (err) {
    console.error("Error parseando JSON:", err);
    return;
  }

  const id = userLocal?.ID_Usuario;
  if (!id) {
    console.error("ID_Usuario no existe en el localStorage.user");
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/perfil/${id}`);
    const result = await res.json();

    console.log("PERFIL RECIBIDO:", result);

    if (!result.ok || !result.usuario) {
      console.error("El backend no devolvió usuario válido.");
      return;
    }

    const user = result.usuario;

    document.getElementById("p_nombre").textContent     = user.Usuario_Nombre || "—";
    document.getElementById("p_apellido").textContent   = user.Usuario_Apellido || "—";
    document.getElementById("p_correo").textContent     = user.Correo || "—";
    document.getElementById("p_telefono").textContent   = user.Telefono || "—";
    document.getElementById("p_direccion").textContent  = user.Direccion || "—";
    document.getElementById("p_rol").textContent        = user.Rol || "—";  

  } catch (err) {
    console.error("Error cargando perfil:", err);
  }
}
