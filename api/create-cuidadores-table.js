const { Pool } = require("pg");

// Configuración de PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "MedAlerta",
  password: process.env.DB_PASSWORD || "123456789",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
});

async function createCuidadoresTable() {
  try {
    // Crear tabla de cuidadores
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Cuidadores" (
        "idCuidador" SERIAL PRIMARY KEY,
        "NomCuidador" VARCHAR(100) NOT NULL,
        "Email" VARCHAR(100) UNIQUE NOT NULL,
        "Contrasenia" VARCHAR(255) NOT NULL,
        "NumCel" VARCHAR(20),
        "DireCasa" VARCHAR(200),
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de relación cuidadores-pacientes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "CuidadoresPacientes" (
        "id" SERIAL PRIMARY KEY,
        "idCuidador" INTEGER REFERENCES "Cuidadores"("idCuidador") ON DELETE CASCADE,
        "idPaciente" INTEGER REFERENCES "Pacientes"("idPaciente") ON DELETE CASCADE,
        "fechaAsignacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "activo" BOOLEAN DEFAULT true,
        UNIQUE("idCuidador", "idPaciente")
      )
    `);

    // Crear tabla de logs de adherencia para seguimiento en tiempo real
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "LogAdherencia" (
        "id" SERIAL PRIMARY KEY,
        "idPaciente" INTEGER REFERENCES "Pacientes"("idPaciente") ON DELETE CASCADE,
        "idMedica" INTEGER REFERENCES "Medicamentos"("idMedica") ON DELETE CASCADE,
        "fechaHora" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "estado" VARCHAR(20) NOT NULL CHECK (estado IN ('cumplida', 'no_cumplida', 'retrasada')),
        "observaciones" TEXT,
        "idCuidador" INTEGER REFERENCES "Cuidadores"("idCuidador"),
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear índices para optimizar consultas
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cuidadores_pacientes_cuidador 
      ON "CuidadoresPacientes"("idCuidador")
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cuidadores_pacientes_paciente 
      ON "CuidadoresPacientes"("idPaciente")
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_log_adherencia_paciente 
      ON "LogAdherencia"("idPaciente")
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_log_adherencia_fecha 
      ON "LogAdherencia"("fechaHora")
    `);

    console.log("✅ Tablas de cuidadores creadas exitosamente");
    console.log("📊 Tablas creadas:");
    console.log("   - Cuidadores");
    console.log("   - CuidadoresPacientes");
    console.log("   - LogAdherencia");
    console.log("   - Índices optimizados");

  } catch (error) {
    console.error("❌ Error al crear tablas de cuidadores:", error);
  } finally {
    await pool.end();
  }
}

createCuidadoresTable();
