document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const correo = document.getElementById("correo").value.trim();
    const contrasena = document.getElementById("contraseña").value.trim();
    if (!correo || !contrasena) { alert("Completa todos los campos"); return; }

    try {
      const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Correo: correo, Contrasena: contrasena })
      });
      const result = await res.json();

      if (res.ok && result.ok) {
        const user = result.user;
        const token = result.token;

        // Guardar token y usuario (sin modificar el token)
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("ID_Usuario", String(user.ID_Usuario));

        // Normalizar y guardar rol
        const role = (user.Rol || user.rol || user.role || "").toString().toLowerCase();
        localStorage.setItem("role", role);

        // Redirigir según rol
        switch (role) {
          case "administrador":
          case "admin":
            window.location.href = "/HTML/index_dasboard_admin.html";
            break;
          case "agricultor":
          case "farmer":
            window.location.href = "/HTML/index_dasborad_agricultor.html";
            break;
          case "empleado":
          case "employee":
            window.location.href = "/HTML/index_dasboard_empleado.html";
            break;
          default:
            // rol desconocido: llevar a un dashboard genérico o home
            window.location.href = "/HTML/index_dasborad_agricultor.html";
            break;
        }
      } else {
        alert(result.error || "Credenciales incorrectas");
      }
    } catch (err) {
      console.error("Error login:", err);
      alert("No se pudo conectar con el servidor.");
    }
  });
});