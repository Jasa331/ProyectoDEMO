// registro.js

document.addEventListener("DOMContentLoaded", () => {
    // 1. Obtener el formulario por su ID
    const form = document.getElementById("registerForm");
    
    // Si el formulario no existe, detener la ejecución (útil para prevenir errores)
    if (!form) {
        console.error("No se encontró el formulario con ID 'registerForm'.");
        return;
    }

    // 2. Escuchar el evento de envío del formulario
    form.addEventListener("submit", async (e) => {
        e.preventDefault(); // Prevenir el envío tradicional del formulario

        // 3. Recopilar los datos del formulario
        const data = {
            Usuario_Nombre: document.getElementById("nombre").value.trim(),
            Usuario_Apellido: document.getElementById("apellido").value.trim(),
            Direccion: document.getElementById("direccion").value.trim(),
            Telefono: document.getElementById("telefono").value.trim(),
            Rol: document.getElementById("perfil").value, // Asumo que "perfil" es el ID del select para el Rol
            Correo: document.getElementById("correo").value.trim(),
            Contrasena: document.getElementById("contraseña").value.trim() // Se envía en texto plano para que el servidor la hashee
        };

        try {
            // 4. Enviar los datos al endpoint de registro en el servidor
            const res = await fetch("http://localhost:3000/registro", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            // 5. Manejar la respuesta del servidor
            if (res.ok) {
                // Registro exitoso (código de estado 200-299)
                alert("✅ Registro exitoso. Ahora puedes iniciar sesión.");
                // Redirigir al usuario a la página de login
                window.location.href = "../HTML/index_login.html"; 
            } else {
                // Error en el servidor (ej: campos faltantes, correo ya registrado, etc.)
                alert(`❌ Error: ${result.error || "Error desconocido en el registro"}`);
            }
        } catch (err) {
            // Error de conexión de red (el servidor no está corriendo o hay un problema de CORS)
            console.error("Error al conectar con el servidor:", err);
            alert("⚠️ No se pudo conectar con el servidor. Asegúrate de que tu servidor Node.js esté corriendo.");
        }
    });
});