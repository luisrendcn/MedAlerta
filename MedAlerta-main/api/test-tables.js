const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "192.168.80.65", // mismo host de tu conexión
  database: "MedAlerta",
  password: "123456789", // cámbialo si es diferente
  port: 5432,
});

async function verificarTablas() {
  console.log("🔄 Intentando conectar a la base de datos...");
  try {
    const client = await pool.connect();
    console.log("✅ Conexión establecida con éxito.\n");

    const result = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
    );

    if (result.rows.length > 0) {
      console.log("📋 Tablas encontradas en la base de datos MedAlerta:");
      result.rows.forEach((row) => console.log("- " + row.table_name));
    } else {
      console.log("⚠️ No se encontraron tablas en el esquema público.");
    }

    client.release();
  } catch (error) {
    console.error("❌ Error al conectarse o listar tablas:", error.message);
  } finally {
    await pool.end();
  }
}

verificarTablas();
