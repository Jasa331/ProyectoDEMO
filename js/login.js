

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const correo = document.getElementById("correo").value.trim();
        const contrasena = document.getElementById("contraseña").value.trim();

        if (!correo || !contrasena) {
            alert("Por favor, completa todos los campos");
            return;
        }

        try {
            const res = await fetch("http://localhost:3000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Correo: correo, Contrasena: contrasena })
            });

            const result = await res.json();

            if (res.ok && result.ok) {
                const user = result.user;
                console.log("Usuario logueado:", user);

                // Guardar usuario en localStorage
                localStorage.setItem("usuarioActivo", JSON.stringify(user));
                alert(`Bienvenido ${user.Usuario_Nombre}`);

                // Normalizar rol
                const rol = (user.Rol || user.rol).toLowerCase();
                console.log("Rol detectado:", rol);

                // Redirigir según el rol
                switch (rol) {
                    case "administrador":
                        window.location.href = "http://127.0.0.1:5500/HTML/index_dasboard_admin.html";
                        break;
                    case "agricultor":
                        window.location.href = "http://127.0.0.1:5500/HTML/index_dasboard_agricultor.html";
                        break;
                    case "empleado":
                        window.location.href = "http://127.0.0.1:5500/HTML/index_dasboard_empleado.html";
                        break;
                    default:
                        alert("Rol no reconocido. Contacta al administrador.");
                        break;
                }
            } else {
                alert(result.error || "Credenciales incorrectas");
            }
        } catch (err) {
            console.error("Error login:", err);
            alert("No se pudo conectar con el servidor. Asegúrate de que Node.js esté corriendo.");
        }
    });
});
