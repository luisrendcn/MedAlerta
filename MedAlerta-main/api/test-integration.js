const { spawn } = require("child_process");
const axios = require("axios");
const { Pool } = require("pg");

// Configuración de PostgreSQL
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "MedAlerta",
  password: "123456789",
  port: 5432,
});

async function runTests() {
  console.log("🚀 Iniciando servidor y pruebas...");

  // Iniciar el servidor como proceso hijo
  const serverProcess = spawn("node", ["server.js"], {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  // Esperar a que el servidor inicie
  await new Promise((resolve) => setTimeout(resolve, 3000));

  try {
    // Probar registro
    console.log("🧪 Probando registro...");
    const registerData = {
      NomPaci: "Carmen Emilia Test",
      FeNaci: "1990-01-01",
      DireCasa: "Test Address",
      NumCel: 1234567890,
      Email: "carmenemili727@gmail.com",
      Contraseña: "TestPass123",
    };

    const registerResponse = await axios.post(
      "http://localhost:3000/api/register",
      registerData
    );
    console.log("✅ Registro exitoso:", registerResponse.data);

    // Probar login
    console.log("🔑 Probando login...");
    const loginData = {
      Email: "eljuandi93@gmail.com",
      Contraseña: "V3017911830",
    };

    const loginResponse = await axios.post(
      "http://localhost:3000/api/login",
      loginData
    );
    console.log("✅ Login exitoso:", loginResponse.data);

    // Verificar que se guardó el registro de sesión
    console.log("🔍 Verificando registro de sesión...");
    const sessionCheck = await pool.query(
      'SELECT * FROM "Sesiones" WHERE "idPaciente" = $1 ORDER BY "fechaLogin" DESC LIMIT 1',
      [loginResponse.data.paciente.idPaciente]
    );

    if (sessionCheck.rows.length > 0) {
      console.log("✅ Registro de sesión guardado:", sessionCheck.rows[0]);
    } else {
      console.log("❌ No se encontró registro de sesión");
    }

    console.log("🎉 Todas las pruebas pasaron!");
  } catch (error) {
    console.error("❌ Error en las pruebas:", error.message);
    if (error.response) {
      console.error("Respuesta del servidor:", error.response.data);
    }
  } finally {
    // Detener el servidor
    serverProcess.kill();
    console.log("🔚 Servidor detenido");
    // Cerrar pool de BD
    await pool.end();
  }
}

runTests();
