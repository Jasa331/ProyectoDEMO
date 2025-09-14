// ==================== LOGIN ====================
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const KEY = "usuarios";          // Aquí guardamos los usuarios en LocalStorage
    const SESSION_KEY = "usuarioActivo";

    // Función para convertir texto a hash SHA-256
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    }

    // ❌ Eliminado el auto-redireccionamiento al cargar
    // Así siempre se pedirá usuario y contraseña primero

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const usuario = document.getElementById("usuario").value.trim();
        const contraseña = document.getElementById("contraseña").value.trim();

        if (!usuario || !contraseña) {
            alert("Por favor, completa todos los campos");
            return;
        }

        // Obtener usuarios registrados
        const usuarios = JSON.parse(localStorage.getItem(KEY) || "[]");

        // Hasheamos la contraseña ingresada
        const hashedPassword = await hashPassword(contraseña);

        // Buscar usuario con el hash
        const userFound = usuarios.find(u => u.usuario === usuario && u.contraseña === hashedPassword);

        if (userFound) {
            // Guardamos sesión activa
            localStorage.setItem(SESSION_KEY, JSON.stringify(userFound));

            // Redirigimos según el perfil
            if (userFound.perfil === "admin") {
                window.location.href = "../HTML/index_dasboard_admin.html";
            } else if (userFound.perfil === "usuario") {
                window.location.href = "../HTML/index_dasborad_agricultor.html";
            } else {
                window.location.href = "../HTML/index_inicio.html";
            }
        } else {
            alert("Usuario o contraseña incorrectos.");
        }
    });
});