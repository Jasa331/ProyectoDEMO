from flask import Flask, request, jsonify
from flask_cors import CORS 
from email.message import EmailMessage
import smtplib

app = Flask(__name__)
CORS(app)

@app.route("/api/recuperar", methods=["POST"])
def recuperar():
    try:
        data = request.get_json()
        email_usuario = data.get("email")

        if not email_usuario:
            return jsonify({"message": "Correo no válido"}), 400
        remitente = "soporteagricord@gmail.com"
        clave = "zvsa huun ewyn rwuf"
        mensaje = f"Hola, {email_usuario}. Haz clic en el enlace para recuperar tu contraseña."

        # Configuración del correo
        email = EmailMessage()
        email["From"] = remitente
        email["To"] = email_usuario
        email["Subject"] = "Recuperación de contraseña"
        email.set_content(mensaje)

        smtp = smtplib.SMTP_SSL("smtp.gmail.com")
        smtp.login(remitente, clave)
        smtp.sendmail(remitente, email_usuario, email.as_string())
        smtp.quit()

        return jsonify({"message": "Correo enviado correctamente"}), 200

    except Exception as e:
        print("Error en el Backend (Flask):", e)
        return jsonify({"message": "Error al enviar correo. Revisa la consola del servidor."}), 500

if __name__ == "__main__":
    app.run(port=3000, debug=True)