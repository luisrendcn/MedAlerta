const axios = require("axios");

async function run() {
  try {
    const testData = {
      NomPaci: "Prueba API Registro",
      FeNaci: "1990-01-01",
      DireCasa: "Calle Test 123",
      NumCel: 3001234567,
      Email: "prueba.api.registro@example.com",
      Contraseña: "ApiTestPass123",
    };

    console.log("Enviando POST a http://localhost:3000/api/register");
    const res = await axios.post(
      "http://localhost:3000/api/register",
      testData,
      { timeout: 20000 }
    );
    console.log("Respuesta status:", res.status);
    console.log("Respuesta data:", res.data);
  } catch (err) {
    if (err.response) {
      console.error("Error response status:", err.response.status);
      console.error("Error response data:", err.response.data);
    } else {
      console.error("Error al conectar con API:", err.message);
    }
  }
}

run();
