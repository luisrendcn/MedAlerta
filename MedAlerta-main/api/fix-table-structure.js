const { Pool } = require("pg");

// Configuración de PostgreSQL
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "MedAlerta",
  password: "123456789",
  port: 5432,
});

async function fixTableStructure() {
  try {
    console.log("🔧 Corrigiendo estructura de la tabla Pacientes...");

    // Verificar si hay datos existentes
    const countResult = await pool.query('SELECT COUNT(*) FROM "Pacientes"');
    const existingRecords = parseInt(countResult.rows[0].count);

    if (existingRecords > 0) {
      console.log(`⚠️ Atención: Hay ${existingRecords} registros existentes`);
      console.log("💾 Creando respaldo antes de modificar...");

      // Crear tabla de respaldo
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "Pacientes_backup" AS 
        SELECT * FROM "Pacientes"
      `);
      console.log("✅ Respaldo creado en tabla 'Pacientes_backup'");
    }

    // Eliminar la tabla actual
    console.log("🗑️ Eliminando tabla actual...");
    await pool.query('DROP TABLE IF EXISTS "Pacientes" CASCADE');

    // Crear nueva tabla con estructura correcta
    console.log("🏗️ Creando nueva tabla con estructura correcta...");
    await pool.query(`
      CREATE TABLE "Pacientes" (
        "idPaciente" BIGSERIAL PRIMARY KEY,
        "NomPaci" VARCHAR(255) NOT NULL,
        "FeNaci" DATE,
        "DireCasa" VARCHAR(255),
        "NumCel" BIGINT NOT NULL,
        "Email" VARCHAR(255) NOT NULL UNIQUE,
  "Contrasenia" VARCHAR(255) NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ Nueva tabla creada exitosamente");

    // Si había datos, intentar restaurarlos (con conversión)
    if (existingRecords > 0) {
      try {
        console.log("🔄 Intentando restaurar datos del respaldo...");

        // Nota: Como el Email era ARRAY, necesitamos convertirlo
        await pool.query(`
          INSERT INTO "Pacientes" ("NomPaci", "FeNaci", "DireCasa", "NumCel", "Email", "Contrasenia")
          SELECT 
            "NomPaci", 
            "FeNaci", 
            "DireCasa", 
            "NumCel", 
            CASE 
              WHEN "Email" IS NOT NULL THEN array_to_string("Email", '')
              ELSE 'email_no_disponible@ejemplo.com'
            END as "Email",
            "Contrasenia"
          FROM "Pacientes_backup"
        `);

        console.log("✅ Datos restaurados exitosamente");

        // Verificar datos restaurados
        const newCount = await pool.query('SELECT COUNT(*) FROM "Pacientes"');
        console.log(`📊 Registros restaurados: ${newCount.rows[0].count}`);
      } catch (restoreError) {
        console.error("⚠️ Error al restaurar datos:", restoreError.message);
        console.log(
          "💡 Los datos del respaldo están en 'Pacientes_backup' y pueden restaurarse manualmente"
        );
      }
    }

    // Verificar estructura final
    console.log("🔍 Verificando estructura final...");
    const columnCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'Pacientes'
      ORDER BY ordinal_position
    `);

    console.log("📋 Nueva estructura de la tabla Pacientes:");
    columnCheck.rows.forEach((col) => {
      const maxLength = col.character_maximum_length
        ? ` (${col.character_maximum_length})`
        : "";
      console.log(
        `  - ${col.column_name}: ${col.data_type}${maxLength} (${
          col.is_nullable === "YES" ? "nullable" : "not null"
        })`
      );
    });

    console.log("✅ Estructura de la tabla corregida exitosamente!");
  } catch (error) {
    console.error("❌ Error al corregir estructura:", error.message);
    console.error("🔍 Detalles:", error);
  } finally {
    await pool.end();
    console.log("🔚 Corrección de estructura completada");
  }
}

fixTableStructure();
