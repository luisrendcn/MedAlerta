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
  host: "localhost",
  database: "MedAlerta",
  password: "123456789",
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
    // Guardar registro de sesión
    try {
      await pool.query(
        'INSERT INTO "Sesiones" ("idPaciente", "ipAddress", "userAgent") VALUES ($1, $2, $3)',
        [paciente.idPaciente, req.ip, req.get("User-Agent")]
      );
      console.log(
        `📝 Sesión registrada para paciente ID: ${paciente.idPaciente}`
      );
    } catch (sessionError) {
      console.error("Error al guardar sesión:", sessionError);
      // No fallar el login por error en logging
    }

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

// Endpoints para medicamentos

// Listar medicamentos de un paciente
app.get("/api/medicamentos/:idPaciente", async (req, res) => {
  try {
    const { idPaciente } = req.params;

    const result = await pool.query(
      'SELECT * FROM "Medicamentos" WHERE "idPaciente" = $1 ORDER BY "horario"',
      [idPaciente]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener medicamentos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Crear medicamento
app.post("/api/medicamentos", async (req, res) => {
  try {
    const { idPaciente, nombre, dosis, horario } = req.body;

    if (!idPaciente || !nombre || !dosis || !horario) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const result = await pool.query(
      'INSERT INTO "Medicamentos" ("idPaciente", "NomMedica", "Dosis", "horario") VALUES ($1, $2, $3, $4) RETURNING *',
      [idPaciente, nombre, dosis, horario]
    );

    res.status(201).json({
      message: "Medicamento registrado exitosamente",
      medicamento: result.rows[0],
    });
  } catch (error) {
    console.error("Error al crear medicamento:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Editar medicamento
app.put("/api/medicamentos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, dosis, horario } = req.body;

    if (!nombre || !dosis || !horario) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const result = await pool.query(
      'UPDATE "Medicamentos" SET "NomMedica" = $1, "Dosis" = $2, "horario" = $3, "updated_at" = CURRENT_TIMESTAMP WHERE "idMedica" = $4 RETURNING *',
      [nombre, dosis, horario, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Medicamento no encontrado" });
    }

    res.json({
      message: "Medicamento actualizado exitosamente",
      medicamento: result.rows[0],
    });
  } catch (error) {
    console.error("Error al actualizar medicamento:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Eliminar medicamento
app.delete("/api/medicamentos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM "Medicamentos" WHERE "idMedica" = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Medicamento no encontrado" });
    }

    res.json({
      message: "Medicamento eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar medicamento:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Endpoint para log de dosis
app.post("/api/log-dose", async (req, res) => {
  try {
    const { idMedica, estado } = req.body;

    if (!idMedica || !estado) {
      return res.status(400).json({ error: "idMedica y estado son obligatorios" });
    }

    if (!['atendida', 'no_atendida'].includes(estado)) {
      return res.status(400).json({ error: "Estado debe ser 'atendida' o 'no_atendida'" });
    }

    const result = await pool.query(
      'INSERT INTO dosis_log (id_medica, hora_alerta, estado) VALUES ($1, CURRENT_TIMESTAMP, $2) RETURNING *',
      [idMedica, estado]
    );

    res.status(201).json({
      message: "Log de dosis registrado",
      log: result.rows[0],
    });
  } catch (error) {
    console.error("Error al loggear dosis:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Iniciar servidor - Escuchar en todas las interfaces (0.0.0.0)
const server = app.listen(PORT, "0.0.0.0", () => {
  // Mostrar información exacta de bind para depuración de red
  const addr = server.address();
  const host = addr && addr.address ? addr.address : "unknown";
  const port = addr && addr.port ? addr.port : PORT;

  console.log(
    `\n✅ Servidor configurado correctamente, esperando conexiones...`
  );
  console.log(`🚀 API MedAlerta corriendo en http://${host}:${port}`);
  console.log(`📊 Conectado a PostgreSQL - Base de datos: MedAlerta`);
  console.log(`⏰ Servidor iniciado en: ${new Date().toLocaleString()}`);
  console.log(
    `ℹ️ Dirección de bind detectada por Node: ${JSON.stringify(addr)}`
  );
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
