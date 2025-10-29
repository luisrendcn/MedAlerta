const { Pool } = require("pg");

// Configuración de PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "MedAlerta",
  password: process.env.DB_PASSWORD || "123456789",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
});

async function assignPatientsToCaregivers() {
  try {
    // Obtener todos los cuidadores
    const cuidadoresResult = await pool.query('SELECT "idCuidador" FROM "Cuidadores"');
    const cuidadores = cuidadoresResult.rows;

    if (cuidadores.length === 0) {
      console.log("❌ No hay cuidadores en la base de datos");
      return;
    }

    // Obtener todos los pacientes
    const pacientesResult = await pool.query('SELECT "idPaciente" FROM "Pacientes"');
    const pacientes = pacientesResult.rows;

    if (pacientes.length === 0) {
      console.log("❌ No hay pacientes en la base de datos");
      return;
    }

    console.log(`📊 Encontrados ${cuidadores.length} cuidadores y ${pacientes.length} pacientes`);

    // Asignar pacientes a cuidadores de forma distribuida
    let asignaciones = 0;
    for (let i = 0; i < cuidadores.length; i++) {
      const cuidador = cuidadores[i];
      
      // Asignar 2-3 pacientes por cuidador (distribución simple)
      const pacientesPorCuidador = Math.min(3, Math.ceil(pacientes.length / cuidadores.length));
      const inicio = (i * pacientesPorCuidador) % pacientes.length;
      
      for (let j = 0; j < pacientesPorCuidador; j++) {
        const pacienteIndex = (inicio + j) % pacientes.length;
        const paciente = pacientes[pacienteIndex];
        
        try {
          await pool.query(
            'INSERT INTO "CuidadoresPacientes" ("idCuidador", "idPaciente", "activo") VALUES ($1, $2, $3) ON CONFLICT ("idCuidador", "idPaciente") DO NOTHING',
            [cuidador.idCuidador, paciente.idPaciente, true]
          );
          asignaciones++;
        } catch (error) {
          // Ignorar errores de duplicados
          if (!error.message.includes('duplicate key')) {
            console.error(`Error asignando paciente ${paciente.idPaciente} a cuidador ${cuidador.idCuidador}:`, error.message);
          }
        }
      }
    }

    console.log(`✅ Asignación completada: ${asignaciones} relaciones creadas`);

    // Mostrar resumen de asignaciones
    const resumenResult = await pool.query(`
      SELECT 
        c."NomCuidador",
        c."Email",
        COUNT(cp."idPaciente") as pacientes_asignados
      FROM "Cuidadores" c
      LEFT JOIN "CuidadoresPacientes" cp ON c."idCuidador" = cp."idCuidador" AND cp."activo" = true
      GROUP BY c."idCuidador", c."NomCuidador", c."Email"
      ORDER BY c."idCuidador"
    `);

    console.log("\n📋 Resumen de asignaciones:");
    resumenResult.rows.forEach(row => {
      console.log(`   ${row.NomCuidador} (${row.Email}): ${row.pacientes_asignados} pacientes`);
    });

  } catch (error) {
    console.error("❌ Error en asignación de pacientes:", error);
  } finally {
    await pool.end();
  }
}

assignPatientsToCaregivers();
