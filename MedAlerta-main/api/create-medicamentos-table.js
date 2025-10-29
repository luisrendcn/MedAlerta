const { Pool } = require("pg");

// Configuración de PostgreSQL
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "MedAlerta",
  password: "123456789",
  port: 5432,
});

async function createMedicamentosTable() {
  try {
    console.log("🏗️ Creando tabla de medicamentos...");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Medicamentos" (
        "idMedicamento" BIGSERIAL PRIMARY KEY,
        "idPaciente" BIGINT NOT NULL REFERENCES "Pacientes"("idPaciente"),
        "nombre" VARCHAR(255) NOT NULL,
        "dosis" VARCHAR(100) NOT NULL,
        "horario" TIME NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ Tabla 'Medicamentos' creada exitosamente");

    // Verificar estructura
    const columnCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Medicamentos'
      ORDER BY ordinal_position
    `);

    console.log("📋 Estructura de la tabla Medicamentos:");
    columnCheck.rows.forEach((col) => {
      console.log(
        `  - ${col.column_name}: ${col.data_type} (${col.is_nullable === "YES" ? "nullable" : "not null"})`
      );
    });

  } catch (error) {
    console.error("❌ Error creando tabla de medicamentos:", error.message);
  } finally {
    await pool.end();
    console.log("🔚 Creación de tabla completada");
  }
}

createMedicamentosTable();