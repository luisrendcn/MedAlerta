const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "MedAlerta",
  password: "123456789",
  port: 5432,
});

async function checkUser() {
  try {
    const result = await pool.query(
      'SELECT * FROM "Pacientes" WHERE "Email" = $1',
      ["eljuandi93@gmail.com"]
    );

    if (result.rows.length > 0) {
      console.log("✅ Usuario encontrado:");
      console.log(result.rows[0]);
    } else {
      console.log("❌ Usuario NO encontrado con email: eljuandi93@gmail.com");
    }
  } catch (error) {
    console.error("Error al consultar BD:", error.message);
  } finally {
    await pool.end();
  }
}

checkUser();
