const { Pool } = require("pg");

// Configuración de PostgreSQL
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "MedAlerta",
  password: "123456789",
  port: 5432,
});

async function createSessionsTable() {
  try {
    console.log("🏗️ Creando tabla de sesiones...");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Sesiones" (
        "idSesion" BIGSERIAL PRIMARY KEY,
        "idPaciente" BIGINT NOT NULL REFERENCES "Pacientes"("idPaciente"),
        "fechaLogin" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "ipAddress" VARCHAR(45),
        "userAgent" TEXT
      )
    `);

    console.log("✅ Tabla 'Sesiones' creada exitosamente");

    // Verificar estructura
    const columnCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Sesiones'
      ORDER BY ordinal_position
    `);

    console.log("📋 Estructura de la tabla Sesiones:");
    columnCheck.rows.forEach((col) => {
      console.log(
        `  - ${col.column_name}: ${col.data_type} (${
          col.is_nullable === "YES" ? "nullable" : "not null"
        })`
      );
    });
  } catch (error) {
    console.error("❌ Error creando tabla de sesiones:", error.message);
  } finally {
    await pool.end();
    console.log("🔚 Creación de tabla completada");
  }
}

createSessionsTable();
