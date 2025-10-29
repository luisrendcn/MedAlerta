const { Pool } = require("pg");

// Configuración de PostgreSQL
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "MedAlerta",
  password: "123456789",
  port: 5432,
});

async function testConnection() {
  try {
    console.log("🔄 Probando conexión a PostgreSQL...");

    // Probar conexión básica
    const client = await pool.connect();
    console.log("✅ Conexión exitosa a PostgreSQL");

    // Verificar que la base de datos existe
    const result = await client.query("SELECT current_database()");
    console.log("📊 Base de datos actual:", result.rows[0].current_database);

    // Verificar que la tabla Pacientes existe
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'Pacientes'
    `);

    if (tableCheck.rows.length > 0) {
      console.log("✅ Tabla 'Pacientes' existe");

      // Verificar estructura de la tabla
      const columnCheck = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'Pacientes'
        ORDER BY ordinal_position
      `);

      console.log("📋 Estructura de la tabla Pacientes:");
      columnCheck.rows.forEach((col) => {
        console.log(
          `  - ${col.column_name}: ${col.data_type} (${
            col.is_nullable === "YES" ? "nullable" : "not null"
          })`
        );
      });

      // Contar registros existentes
      const countResult = await client.query(
        'SELECT COUNT(*) FROM "Pacientes"'
      );
      console.log(`📈 Registros existentes: ${countResult.rows[0].count}`);
    } else {
      console.log("❌ Tabla 'Pacientes' no existe");
      console.log("💡 Necesitas crear la tabla primero");
    }

    client.release();
  } catch (error) {
    console.error("❌ Error de conexión:", error.message);
    console.error("🔍 Detalles completos:", error);

    if (error.code === "ECONNREFUSED") {
      console.log(
        "💡 PostgreSQL no está ejecutándose o no está disponible en el puerto 5432"
      );
    } else if (error.code === "3D000") {
      console.log("💡 La base de datos 'MedAlerta' no existe");
    } else if (error.code === "28P01") {
      console.log("💡 Credenciales de autenticación incorrectas");
    }
  } finally {
    await pool.end();
    console.log("🔚 Prueba de conexión completada");
  }
}

testConnection();
