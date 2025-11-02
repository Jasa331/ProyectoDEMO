// ==========================
// Mostrar / ocultar contraseña
// ==========================
window.togglePassword = function (id, el) {
  const input = document.getElementById(id);
  if (input.type === "password") {
    input.type = "text";
    el.textContent = "🙈";
  } else {
    input.type = "password";
    el.textContent = "👁";
  }
};

// ==========================
// Mostrar el correo del usuario
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");
  const emailInput = document.getElementById("email");

  if (email) {
    // Si viene por la URL, lo muestra y bloquea edición
    emailInput.value = email;
    emailInput.readOnly = true;
  } else {
    // Si no viene, permite escribirlo manualmente
    emailInput.removeAttribute("readonly");
    emailInput.placeholder = "Ingresa tu correo";
  }
});

// ==========================
// Enviar nueva contraseña
// ==========================
document.getElementById("resetForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!email) {
    alert("❌ Debes ingresar tu correo electrónico.");
    return;
  }

  if (password !== confirmPassword) {
    alert("⚠️ Las contraseñas no coinciden");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/cambiar-contrasena", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      alert(data.message || "✅ Contraseña actualizada correctamente");
      window.location.href = "../HTML/index_login.html";
    } else {
      alert("⚠️ " + data.message);
    }
  } catch (error) {
    console.error(error);
    alert("❌ Error al conectar con el servidor");
  }
});
