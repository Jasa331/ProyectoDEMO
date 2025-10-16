function mostrarSeccion(id) {
    const secciones = document.querySelectorAll('.seccion');
    secciones.forEach(sec => {
        sec.classList.remove("activa");
        sec.style.display = "none";
    });

    if (id === 'cerrarSesion') {
        const confirmar = confirm("¿Estás seguro que deseas cerrar sesión?");
        if (!confirmar) {
            mostrarSeccion('dashboard');
            return;
        }
        
        // 🛠️ La página de destino es index_Inicio.html
        localStorage.clear();
        sessionStorage.clear(); 
        
        // Usamos la ruta absoluta si el archivo está en la raíz del servidor (carpeta HTML/)
        // Si el archivo está en la misma carpeta que el dashboard, esta ruta funcionará:
        window.location.href = '/index_Inicio.html'; 
        
        return;
    }

    const target = document.getElementById(id);
    if (target) {
        target.style.display = "block";
        setTimeout(() => target.classList.add("activa"), 10); // retardo pequeño para que dispare la animación
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const openMonitor = document.getElementById("openMonitor");
    const climaModal = document.getElementById("climaModal");
    const closeModal = document.getElementById("closeModal");

    // Abrir modal
    if (openMonitor) {
        openMonitor.addEventListener("click", (e) => {
            e.preventDefault();
            climaModal.style.display = "flex";
        });
    }

    // Cerrar modal
    if (closeModal) {
        closeModal.addEventListener("click", () => {
            climaModal.style.display = "none";
        });
    }

    // Cerrar modal haciendo clic fuera del contenido
    window.addEventListener("click", (e) => {
        if (e.target === climaModal) {
            climaModal.style.display = "none";
        }
    });
});

const btnTheme = document.getElementById("toggleTheme");

btnTheme.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  if (currentTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
  }
});
