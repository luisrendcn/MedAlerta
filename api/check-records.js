const { Pool } = require("pg");

// Configuración de PostgreSQL
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "MedAlerta",
  password: "123456789",
  port: 5432,
});

async function checkDatabaseRecords() {
  try {
    console.log("🔍 Verificando registros en la base de datos...");
    
    // Obtener todos los pacientes
    const result = await pool.query('SELECT * FROM "Pacientes" ORDER BY "idPaciente"');
    
    console.log(`📊 Total de pacientes registrados: ${result.rows.length}`);
    console.log("\n📋 Lista de pacientes:");
    
    result.rows.forEach((paciente, index) => {
      console.log(`\n${index + 1}. Paciente ID: ${paciente.idPaciente}`);
      console.log(`   Nombre: ${paciente.NomPaci}`);
      console.log(`   Email: ${paciente.Email}`);
      console.log(`   Fecha Nacimiento: ${paciente.FeNaci}`);
      console.log(`   Dirección: ${paciente.DireCasa}`);
      console.log(`   Teléfono: ${paciente.NumCel}`);
      console.log(`   Contraseña: ${paciente.Contraseña.substring(0, 20)}... (encriptada)`);
      console.log(`   Creado: ${paciente.created_at}`);
    });
    
    console.log("\n✅ Verificación completada");
    
  } catch (error) {
    console.error("❌ Error al verificar registros:", error.message);
  } finally {
    await pool.end();
  }
}

checkDatabaseRecords();