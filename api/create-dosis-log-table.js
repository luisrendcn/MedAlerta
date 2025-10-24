// Script para crear tabla dosis_log
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'medalerta',
  password: '1234',
  port: 5432,
});

async function createDosisLogTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dosis_log (
        id SERIAL PRIMARY KEY,
        id_medica INTEGER REFERENCES medicamentos(id_medica),
        hora_alerta TIMESTAMP NOT NULL,
        estado VARCHAR(20) NOT NULL CHECK (estado IN ('atendida', 'no_atendida')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabla dosis_log creada exitosamente');
  } catch (error) {
    console.error('Error creando tabla:', error);
  } finally {
    await pool.end();
  }
}

createDosisLogTable();