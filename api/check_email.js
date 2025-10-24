const { Pool } = require("pg");

// Ajusta host si tu servidor PostgreSQL corre en otra IP (ej: 192.168.80.65)
// Ahora acepta un argumento opcional: node check_email.js <email> <host>
const hostArg = process.argv[3] || "192.168.80.65";
const pool = new Pool({
  user: "postgres",
  host: hostArg,
  database: "MedAlerta",
  password: "123456789",
  port: 5432,
});

async function checkEmail(email) {
  try {
    const result = await pool.query(
      'SELECT * FROM "Pacientes" WHERE "Email" = $1',
      [email]
    );

    if (result.rows.length > 0) {
      console.log("✅ Usuario encontrado:");
      console.log(result.rows[0]);
    } else {
      console.log(`❌ Usuario NO encontrado con email: ${email}`);
    }
  } catch (err) {
    console.error("❌ Error al consultar BD:", err.message);
    console.error(err);
  } finally {
    await pool.end();
  }
}

const emailToCheck = process.argv[2] || "carmenemili727@gmail.com";
checkEmail(emailToCheck);
