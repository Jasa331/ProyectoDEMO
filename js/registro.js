
// ==================== REGISTRO ====================
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm");
    if (!form) return; // <- si no existe el form de registro, no ejecutar

    const KEY = "usuarios";

    // Función para convertir texto a hash SHA-256
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const apellido = document.getElementById("apellido").value.trim();
        const direccion = document.getElementById("direccion").value.trim();
        const telefono = document.getElementById("telefono").value.trim();
        const usuario = document.getElementById("usuario").value.trim();
        const correo = document.getElementById("correo").value.trim();
        const contraseña = document.getElementById("contraseña").value.trim();
        const perfil = document.getElementById("perfil").value; // <-- PERFIL: admin o usuario

        // Validar campos
        if (!nombre || !apellido || !direccion || !telefono || !usuario || !correo || !contraseña || !perfil) {
            alert("Por favor, completa todos los campos");
            return;
        }

        // Leer usuarios guardados
        const usuarios = JSON.parse(localStorage.getItem(KEY) || "[]");

        // Verificar si el usuario o correo ya existen
        const existe = usuarios.some(u => u.usuario === usuario || u.correo === correo);
        if (existe) {
            alert("Este usuario o correo ya está registrado");
            return;
        }

        // Hasheamos la contraseña antes de guardar
        const hashedPassword = await hashPassword(contraseña);

        // Crear objeto usuario con PERFIL
        const nuevoUsuario = {
            nombre,
            apellido,
            direccion,
            telefono,
            usuario,
            correo,
            contraseña: hashedPassword, // Guardamos el hash
            perfil
        };

        // Guardar en LocalStorage
        usuarios.push(nuevoUsuario);
        localStorage.setItem(KEY, JSON.stringify(usuarios));

        // Mensaje de éxito y redirección al login
        alert(`Registro exitoso como ${perfil}. Ahora puedes iniciar sesión.`);

        // Redirigir al login
        window.location.href = "../HTML/index_login.html";
    });
});