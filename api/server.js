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
// Use environment variables when available to make configuration flexible
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "MedAlerta",
  password: process.env.DB_PASSWORD || "123456789",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
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
      // Aceptar columna antigua o nueva (compatibilidad)
      const password =
        paciente.Contrasenia || paciente.contrasenia || paciente.Contraseña;

      // Si la contraseña no está encriptada, encriptarla
      if (!isPasswordHashed(password)) {
        const hashedPassword = await bcrypt.hash(password, 12); // Usar factor 12 para mayor seguridad

        // Actualizar columna a la nueva columna `Contrasenia`
        await pool.query(
          'UPDATE "Pacientes" SET "Contrasenia" = $1 WHERE "idPaciente" = $2',
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
    // Aceptar tanto `Contraseña` (frontend antiguo) como `contrasenia` (columna actual)
    const {
      NomPaci,
      FeNaci,
      DireCasa,
      NumCel,
      Email,
      Contraseña,
      contrasenia,
    } = req.body;
    const plainPassword = Contraseña || contrasenia;

    // Verificar si el email ya existe
    const emailCheck = await pool.query(
      'SELECT * FROM "Pacientes" WHERE "Email" = $1',
      [Email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // Encriptar contraseña con factor de seguridad 12
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    // Insertar nuevo paciente usando la columna `Contrasenia`
    const result = await pool.query(
      'INSERT INTO "Pacientes" ("NomPaci", "FeNaci", "DireCasa", "NumCel", "Email", "Contrasenia") VALUES ($1, $2, $3, $4, $5, $6) RETURNING "idPaciente", "NomPaci", "Email"',
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
    const { Email, Contraseña, contrasenia } = req.body;
    const plainPassword = Contraseña || contrasenia;

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
    const storedPassword =
      paciente.Contrasenia || paciente.contrasenia || paciente.Contraseña;
    if (isPasswordHashed(storedPassword)) {
      // Contraseña ya encriptada, verificar normalmente
      isValidPassword = await bcrypt.compare(plainPassword, storedPassword);
    } else {
      // Contraseña no encriptada, verificar directamente y luego encriptar
      if (storedPassword === plainPassword) {
        isValidPassword = true;

        // Encriptar la contraseña para futuras verificaciones
        const hashedPassword = await bcrypt.hash(plainPassword, 12);
        await pool.query(
          'UPDATE "Pacientes" SET "Contrasenia" = $1 WHERE "idPaciente" = $2',
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
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
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
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
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
      return res
        .status(400)
        .json({ error: "idMedica y estado son obligatorios" });
    }

    if (!["atendida", "no_atendida"].includes(estado)) {
      return res
        .status(400)
        .json({ error: "Estado debe ser 'atendida' o 'no_atendida'" });
    }

    const result = await pool.query(
      "INSERT INTO dosis_log (id_medica, hora_alerta, estado) VALUES ($1, CURRENT_TIMESTAMP, $2) RETURNING *",
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

// ======================
// Autenticación Cuidadores (sin base de datos - solo tokens temporales)
// ======================
const crypto = require("crypto");
const caregiverTokens = new Map(); // token -> { idCuidador, Email, NomCuidador, timestamp }
// Registro en memoria de dosis marcadas por cuidadores: { [idPaciente]: Array<{ts, estado, fuente, nota}> }
const caregiverDoseLogs = new Map();
// Pacientes creados en memoria por cuidadores (cuando BD no está disponible)
const inMemoryPatients = [];
let inMemoryPatientSeq = 1000;

function generateToken() {
  return crypto.randomBytes(24).toString("hex");
}

function generateCuidadorId() {
  return Math.floor(Math.random() * 1000000) + 1; // ID temporal
}

function authCuidador(req, res, next) {
  const authHeader = req.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "")
    : null;
  if (!token || !caregiverTokens.has(token)) {
    return res.status(401).json({ error: "No autorizado" });
  }

  req.cuidador = caregiverTokens.get(token);
  return next();
}

// Limpiar tokens expirados cada 5 minutos
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 horas
  for (const [token, data] of caregiverTokens.entries()) {
    if (now - data.timestamp > maxAge) {
      caregiverTokens.delete(token);
    }
  }
}, 5 * 60 * 1000);

// ======================
// Utilidades de simulación
// ======================
function simulateDoseLogsForPatient(patientId) {
  const logs = [];
  const now = new Date();
  for (let i = 0; i < 10; i++) {
    const ts = new Date(now.getTime() - i * 6 * 60 * 60 * 1000); // cada 6h
    const estado = i % 3 === 0 ? "no_atendida" : i % 2 === 0 ? "atendida" : "atrasada";
    logs.push({ ts: ts.toISOString(), estado, fuente: "simulado" });
  }
  return logs.reverse();
}

// Registro de cuidador (opcional)
app.post("/api/cuidadores/register", async (req, res) => {
  try {
    const { NomCuidador, Email, Contrasenia, NumCel, DireCasa } = req.body;
    if (!NomCuidador || !Email || !Contrasenia) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const existe = await pool.query(
      'SELECT 1 FROM "Cuidadores" WHERE "Email" = $1',
      [Email]
    );
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    const hashed = await bcrypt.hash(Contrasenia, 12);
    const result = await pool.query(
      'INSERT INTO "Cuidadores" ("NomCuidador", "Email", "Contrasenia", "NumCel", "DireCasa") VALUES ($1, $2, $3, $4, $5) RETURNING "idCuidador", "NomCuidador", "Email"',
      [NomCuidador, Email, hashed, NumCel || null, DireCasa || null]
    );

    return res.status(201).json({
      message: "Cuidador registrado",
      cuidador: result.rows[0],
    });
  } catch (error) {
    console.error("Error registrando cuidador:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Login de cuidador (sin base de datos - solo tokens temporales)
app.post("/api/cuidadores/login", async (req, res) => {
  try {
    const { Email, Contrasenia, NomCuidador } = req.body;
    if (!Email || !Contrasenia) {
      return res.status(400).json({ error: "Email y contraseña son obligatorios" });
    }

    // Generar ID temporal para el cuidador
    const idCuidador = generateCuidadorId();
    const nombre = NomCuidador || `Cuidador_${Email.split('@')[0]}`;
    
    // Crear token temporal (sin persistencia en BD)
    const token = generateToken();
    caregiverTokens.set(token, {
      idCuidador: idCuidador,
      Email: Email,
      NomCuidador: nombre,
      timestamp: Date.now()
    });

    console.log(`✅ Cuidador temporal creado: ${Email} (Token: ${token.substring(0, 8)}...)`);

    return res.json({
      message: "Sesión de cuidador iniciada",
      token,
      cuidador: {
        idCuidador: idCuidador,
        NomCuidador: nombre,
        Email: Email,
      },
    });
  } catch (error) {
    console.error("Error en login cuidador:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Helper: obtener pacientes para el panel del cuidador
// Si la BD falla o no está disponible, devolver pacientes de demostración
async function getPacientesAsignados(idCuidador) {
  try {
    const result = await pool.query(
      'SELECT "idPaciente", "NomPaci", "Email" FROM "Pacientes" ORDER BY "NomPaci"'
    );
    // Combinar con pacientes en memoria
    return [...result.rows, ...inMemoryPatients];
  } catch (_err) {
    // Modo offline: datos de demostración sin PII sensible
    return [
      { idPaciente: 101, NomPaci: "Paciente Demo 1", Email: "demo1@paciente" },
      { idPaciente: 102, NomPaci: "Paciente Demo 2", Email: "demo2@paciente" },
      { idPaciente: 103, NomPaci: "Paciente Demo 3", Email: "demo3@paciente" },
      ...inMemoryPatients,
    ];
  }
}

// Endpoint: resumen de cumplimiento por paciente del cuidador
app.get("/api/cuidadores/pacientes-cumplimiento", authCuidador, async (req, res) => {
  try {
    const { idCuidador } = req.cuidador;
    const pacientes = await getPacientesAsignados(idCuidador);

    // Si no hay pacientes asignados, responder vacío
    if (pacientes.length === 0) {
      return res.json({ pacientes: [] });
    }

    // Calcular cumplimiento usando tabla existente dosis_log si existe
    const desde = new Date();
    desde.setDate(desde.getDate() - 7); // últimos 7 días

    const cumplimientoPorPaciente = [];
    for (const paciente of pacientes) {
      let tot = 0;
      let cumplidas = 0;
      try {
        const resLog = await pool.query(
          `SELECT estado FROM dosis_log WHERE id_medica IN (
              SELECT "idMedica" FROM "Medicamentos" WHERE "idPaciente" = $1
           ) AND hora_alerta >= $2`,
          [paciente.idPaciente, desde]
        );
        tot = resLog.rows.length;
        cumplidas = resLog.rows.filter((r) => r.estado === "atendida").length;
      } catch (_e) {
        // Modo offline: simular algunos datos para la demo
        tot = 10;
        cumplidas = paciente.idPaciente % 3 === 0 ? 4 : paciente.idPaciente % 2 === 0 ? 7 : 9;
      }

      const porcentaje = tot > 0 ? Math.round((cumplidas / tot) * 100) : null;

      // Minimizar datos sensibles (ofuscamos email)
      const maskedEmail = paciente.Email && paciente.Email.includes("@")
        ? paciente.Email.replace(/(^.).*(@.*$)/, "$1***$2")
        : null;

      cumplimientoPorPaciente.push({
        idPaciente: paciente.idPaciente,
        NomPaci: paciente.NomPaci,
        Email: maskedEmail,
        cumplimiento7d: porcentaje, // null cuando no hay datos
        totalRegistros7d: tot,
      });
    }

    return res.json({ pacientes: cumplimientoPorPaciente });
  } catch (error) {
    console.error("Error obteniendo cumplimiento:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Crear paciente en memoria (cuando no se quiere depender de BD)
app.post("/api/cuidadores/pacientes", authCuidador, async (req, res) => {
  const { NomPaci, Email } = req.body || {};
  if (!NomPaci) {
    return res.status(400).json({ error: "NomPaci es obligatorio" });
  }
  const nuevo = {
    idPaciente: inMemoryPatientSeq++,
    NomPaci: String(NomPaci).slice(0, 100),
    Email: Email ? String(Email).slice(0, 120) : null,
  };
  inMemoryPatients.push(nuevo);
  return res.status(201).json({ message: "Paciente creado (memoria)", paciente: nuevo });
});

// Eliminar paciente de memoria
app.delete("/api/cuidadores/pacientes/:id", authCuidador, async (req, res) => {
  const patientId = parseInt(req.params.id, 10);
  const index = inMemoryPatients.findIndex(p => p.idPaciente === patientId);
  
  if (index === -1) {
    return res.status(404).json({ error: "Paciente no encontrado" });
  }
  
  // Eliminar paciente de memoria
  inMemoryPatients.splice(index, 1);
  
  // Eliminar también sus logs de dosis
  caregiverDoseLogs.delete(patientId);
  
  return res.json({ message: "Paciente eliminado" });
});

// Listar historial de dosis por paciente (con fallback a simulación + memoria)
app.get("/api/cuidadores/paciente/:id/logs", authCuidador, async (req, res) => {
  const patientId = parseInt(req.params.id, 10);
  try {
    const mem = caregiverDoseLogs.get(patientId) || [];
    try {
      const result = await pool.query(
        `SELECT to_char(hora_alerta, 'YYYY-MM-DD"T"HH24:MI:SSZ') as ts, estado
         FROM dosis_log
         WHERE id_medica IN (SELECT "idMedica" FROM "Medicamentos" WHERE "idPaciente" = $1)
         ORDER BY hora_alerta DESC
         LIMIT 100`,
        [patientId]
      );
      // Mezclar: BD primero, luego registros en memoria del cuidador
      return res.json({
        logs: [...result.rows.map(r => ({ ts: r.ts, estado: r.estado, fuente: "bd" })), ...mem].slice(0, 100)
      });
    } catch (_e) {
      // Sin BD: simular y combinar con memoria
      const simulated = simulateDoseLogsForPatient(patientId);
      return res.json({ logs: [...simulated, ...mem].slice(0, 100) });
    }
  } catch (error) {
    console.error("Error listando logs:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Registrar una dosis (tomada o no tomada) por el cuidador (en memoria)
app.post("/api/cuidadores/paciente/:id/logs", authCuidador, async (req, res) => {
  const patientId = parseInt(req.params.id, 10);
  const { estado, nota } = req.body || {};
  if (!["atendida", "no_atendida", "atrasada"].includes(estado || "")) {
    return res.status(400).json({ error: "Estado inválido" });
  }
  const entry = {
    ts: new Date().toISOString(),
    estado,
    fuente: "cuidador",
    nota: typeof nota === "string" ? nota.substring(0, 200) : undefined,
  };
  const arr = caregiverDoseLogs.get(patientId) || [];
  arr.unshift(entry);
  caregiverDoseLogs.set(patientId, arr.slice(0, 200)); // limitar tamaño
  return res.status(201).json({ message: "Registro guardado", log: entry });
});
