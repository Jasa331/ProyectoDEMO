document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;

  if (!email) {
    alert("Por favor ingresa un correo válido");
    return;
  }

  try {
    const res = await fetch(" ", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("✅ Revisa tu correo, hemos enviado el enlace para restablecer tu contraseña");
    } else {
      alert("⚠️ Error: " + data.message);
    }
  } catch (error) {
    console.error("Error al enviar:", error);
    alert("❌ No se pudo enviar el correo, intenta de nuevo.");
  }
});
