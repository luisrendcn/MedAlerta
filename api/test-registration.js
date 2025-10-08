const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

// Configuración de PostgreSQL
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "MedAlerta",
  password: "123456789",
  port: 5432,
});

async function testRegistration() {
  try {
    console.log("🧪 Probando registro de paciente...");
    
    const testData = {
      NomPaci: "Juan Diego Vasquez Castañeda",
      FeNaci: "2004-10-24",
      DireCasa: "av44c#63-06",
      NumCel: 3017911830,
      Email: "juan.vasquezta@amigo.edu.co",
      Contraseña: "TestPassword123"
    };
    
    console.log("📝 Datos de prueba:", testData);
    
    // Verificar si el email ya existe
    console.log("🔍 Verificando si el email ya existe...");
    const emailCheck = await pool.query(
      'SELECT * FROM "Pacientes" WHERE "Email" = $1',
      [testData.Email]
    );
    
    if (emailCheck.rows.length > 0) {
      console.log("⚠️ El email ya existe, eliminando registro anterior...");
      await pool.query('DELETE FROM "Pacientes" WHERE "Email" = $1', [testData.Email]);
      console.log("✅ Registro anterior eliminado");
    }
    
    // Encriptar contraseña
    console.log("🔐 Encriptando contraseña...");
    const hashedPassword = await bcrypt.hash(testData.Contraseña, 12);
    console.log("✅ Contraseña encriptada");
    
    // Intentar insertar
    console.log("💾 Insertando nuevo paciente...");
    const result = await pool.query(
      'INSERT INTO "Pacientes" ("NomPaci", "FeNaci", "DireCasa", "NumCel", "Email", "Contraseña") VALUES ($1, $2, $3, $4, $5, $6) RETURNING "idPaciente", "NomPaci", "Email"',
      [testData.NomPaci, testData.FeNaci, testData.DireCasa, testData.NumCel, testData.Email, hashedPassword]
    );
    
    console.log("✅ Paciente registrado exitosamente!");
    console.log("📊 Resultado:", result.rows[0]);
    
    // Verificar que se guardó correctamente
    const verificationQuery = await pool.query('SELECT * FROM "Pacientes" WHERE "idPaciente" = $1', [result.rows[0].idPaciente]);
    console.log("🔍 Verificación - Datos guardados:");
    console.log(verificationQuery.rows[0]);
    
  } catch (error) {
    console.error("❌ Error en la prueba de registro:", error.message);
    console.error("🔍 Detalles del error:", error);
    
    if (error.code === '22P02') {
      console.log("💡 Error de tipo de datos - posible problema con la estructura de la tabla");
    } else if (error.code === '23505') {
      console.log("💡 Violación de restricción única - email duplicado");
    } else if (error.code === '22001') {
      console.log("💡 Valor demasiado largo para el tipo de columna");
    }
  } finally {
    await pool.end();
    console.log("🔚 Prueba de registro completada");
  }
}

testRegistration();