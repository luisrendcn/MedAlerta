const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de PostgreSQL usando los datos de settings.py
const pool = new Pool({
  user: "postgres",
  host: "192.168.80.65", //  IP 
  database: "MedAlerta",
  password: "123456789", //  contraseña   postgres
  port: 5432,
});


// Función para verificar si una contraseña está encriptada
function isPasswordHashed(password) {
  // Las contraseñas de bcrypt siempre empiezan con $2a$, $2b$, o $2y$ y tienen 60 caracteres
  return (
    password &&
    (password.startsWith("$2a$") ||
      password.startsWith("$2b$") ||
      password.startsWith("$2y$")) &&
    password.length === 60
  );
}

// Ruta para migrar contraseñas no encriptadas
app.post("/api/migrate-passwords", async (req, res) => {
  try {
    // Obtener todos los pacientes
    const result = await pool.query('SELECT * FROM "Pacientes"');
    let migratedCount = 0;

    for (const paciente of result.rows) {
      const password = paciente.Contraseña;

      // Si la contraseña no está encriptada, encriptarla
      if (!isPasswordHashed(password)) {
        const hashedPassword = await bcrypt.hash(password, 12); // Usar factor 12 para mayor seguridad

        await pool.query(
          'UPDATE "Pacientes" SET "Contraseña" = $1 WHERE "idPaciente" = $2',
          [hashedPassword, paciente.idPaciente]
        );

        migratedCount++;
      }
    }

    res.json({
      message: `Migración completada. ${migratedCount} contraseñas fueron encriptadas.`,
      totalPacientes: result.rows.length,
      contraseñasMigradas: migratedCount,
    });
  } catch (error) {
    console.error("Error en migración:", error);
    res.status(500).json({ error: "Error al migrar contraseñas" });
  }
});

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ message: "API MedAlerta funcionando correctamente" });
});

// Ruta para registrar paciente
app.post("/api/register", async (req, res) => {
  try {
    const { NomPaci, FeNaci, DireCasa, NumCel, Email, Contraseña } = req.body;

    // Verificar si el email ya existe
    const emailCheck = await pool.query(
      'SELECT * FROM "Pacientes" WHERE "Email" = $1',
      [Email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // Encriptar contraseña con factor de seguridad 12
    const hashedPassword = await bcrypt.hash(Contraseña, 12);

    // Insertar nuevo paciente
    const result = await pool.query(
      'INSERT INTO "Pacientes" ("NomPaci", "FeNaci", "DireCasa", "NumCel", "Email", "Contraseña") VALUES ($1, $2, $3, $4, $5, $6) RETURNING "idPaciente", "NomPaci", "Email"',
      [NomPaci, FeNaci, DireCasa, NumCel, Email, hashedPassword]
    );

    res.status(201).json({
      message: "Paciente registrado exitosamente",
      paciente: result.rows[0],
    });
  } catch (error) {
    console.error("Error al registrar paciente:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Ruta para login
app.post("/api/login", async (req, res) => {
  try {
    const { Email, Contraseña } = req.body;

    // Buscar paciente por email
    const result = await pool.query(
      'SELECT * FROM "Pacientes" WHERE "Email" = $1',
      [Email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const paciente = result.rows[0];
    let isValidPassword = false;

    // Verificar si la contraseña está encriptada
    if (isPasswordHashed(paciente.Contraseña)) {
      // Contraseña ya encriptada, verificar normalmente
      isValidPassword = await bcrypt.compare(Contraseña, paciente.Contraseña);
    } else {
      // Contraseña no encriptada, verificar directamente y luego encriptar
      if (paciente.Contraseña === Contraseña) {
        isValidPassword = true;

        // Encriptar la contraseña para futuras verificaciones
        const hashedPassword = await bcrypt.hash(Contraseña, 12);
        await pool.query(
          'UPDATE "Pacientes" SET "Contraseña" = $1 WHERE "idPaciente" = $2',
          [hashedPassword, paciente.idPaciente]
        );

        console.log(
          `Contraseña encriptada automáticamente para paciente ID: ${paciente.idPaciente}`
        );
      }
    }

    if (!isValidPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Login exitoso
    res.json({
      message: "Login exitoso",
      paciente: {
        idPaciente: paciente.idPaciente,
        NomPaci: paciente.NomPaci,
        Email: paciente.Email,
        NumCel: paciente.NumCel,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Ruta para obtener datos del paciente
app.get("/api/paciente/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT "idPaciente", "NomPaci", "FeNaci", "DireCasa", "NumCel", "Email" FROM "Pacientes" WHERE "idPaciente" = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener paciente:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Ruta para verificar estado de encriptación de contraseñas
app.get("/api/password-status", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT "idPaciente", "NomPaci", "Email", "Contraseña" FROM "Pacientes"'
    );

    let encryptedCount = 0;
    let unencryptedCount = 0;
    const patients = [];

    for (const paciente of result.rows) {
      const isEncrypted = isPasswordHashed(paciente.Contraseña);

      if (isEncrypted) {
        encryptedCount++;
      } else {
        unencryptedCount++;
      }

      patients.push({
        idPaciente: paciente.idPaciente,
        NomPaci: paciente.NomPaci,
        Email: paciente.Email,
        isPasswordEncrypted: isEncrypted,
      });
    }

    res.json({
      totalPacientes: result.rows.length,
      contraseñasEncriptadas: encryptedCount,
      contraseñasSinEncriptar: unencryptedCount,
      pacientes: patients,
    });
  } catch (error) {
    console.error("Error al verificar estado de contraseñas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 API MedAlerta corriendo en http://localhost:${PORT}`);
  console.log(`📊 Conectado a PostgreSQL - Base de datos: MedAlerta`);
  console.log(`⏰ Servidor iniciado en: ${new Date().toLocaleString()}`);
});

// Manejo de errores de conexión a la base de datos
pool.on("error", (err) => {
  console.error("Error inesperado en cliente de PostgreSQL", err);
  console.error("El servidor continuará funcionando...");
});

// Manejo de errores del proceso
process.on("uncaughtException", (err) => {
  console.error("Error no capturado:", err);
  console.error("El servidor continuará funcionando...");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Promesa rechazada no manejada en:", promise, "razón:", reason);
  console.error("El servidor continuará funcionando...");
});

console.log("✅ Servidor configurado correctamente, esperando conexiones...");
