const axios = require('axios');

async function testLogin() {
  try {
    const loginData = {
      Email: "eljuandi93@gmail.com",
      Contraseña: "V3017911830",
    };

    const response = await axios.post("http://localhost:3000/api/login", loginData);
    console.log("✅ Login exitoso:", response.data);
  } catch (error) {
    console.error("❌ Error en login:", error.message);
    if (error.response) {
      console.error("Respuesta del servidor:", error.response.data);
    }
  }
}

testLogin();