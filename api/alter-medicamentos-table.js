const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "MedAlerta",
  password: "123456789",
  port: 5432,
});

async function alterMedicamentosTable() {
  try {
    console.log("🔧 Alterando tabla de medicamentos...");

    // Agregar columna horario
    await pool.query(`
      ALTER TABLE "Medicamentos" ADD COLUMN IF NOT EXISTS "horario" TIME;
    `);

    // Cambiar nombres de columnas si es necesario
    // Pero para simplificar, usar los nombres existentes y agregar horario

    console.log("✅ Tabla alterada exitosamente");

    // Verificar estructura final
    const columnCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Medicamentos'
      ORDER BY ordinal_position
    `);

    console.log("📋 Nueva estructura de la tabla Medicamentos:");
    columnCheck.rows.forEach((col) => {
      console.log(
        `  - ${col.column_name}: ${col.data_type} (${col.is_nullable === "YES" ? "nullable" : "not null"})`
      );
    });

  } catch (error) {
    console.error("❌ Error alterando tabla:", error.message);
  } finally {
    await pool.end();
    console.log("🔚 Alteración completada");
  }
}

alterMedicamentosTable();