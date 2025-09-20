   // Función para alternar mostrar/ocultar contraseña
    function togglePassword(id, el) {
      const input = document.getElementById(id);
      if (input.type === "password") {
        input.type = "text";
        el.textContent = "🙈";
      } else {
        input.type = "password";
        el.textContent = "👁";
      }
    }

    // Enviar nueva contraseña
    document.getElementById("resetForm").addEventListener("submit", async (e) => {
      e.preventDefault();

      const params = new URLSearchParams(window.location.search);
      const email = params.get("email"); // viene en el enlace
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (password !== confirmPassword) {
        alert("⚠️ Las contraseñas no coinciden");
        return;
      }

      try {
        const res = await fetch("http://localhost:3000/api/restablecer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (res.ok) {
          alert("✅ Contraseña actualizada correctamente");
          window.location.href = "login.html";
        } else {
          alert("⚠️ " + data.message);
        }
      } catch (error) {
        console.error(error);
        alert("❌ Error al restablecer la contraseña");
      }
    });