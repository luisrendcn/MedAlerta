// Configuración de la API
import { Platform } from 'react-native';

// Para desarrollo local
// Para desarrollo local
// Ajusta esta URL al IP/host correcto desde el que tu app (emulador/dispositivo/PC)
// puede alcanzar el servidor. Ejemplos:
// - Uso directo en la misma máquina: http://127.0.0.1:3000
// - Android emulator (default): http://10.0.2.2:3000
// - iOS simulator: http://127.0.0.1:3000
// - Reemplaza por la IP de tu máquina en la red local si usas un dispositivo físico.
const DEV_CONFIG = {
  // Servidor Node.js corriendo en localhost:3000
  API_BASE_URL: Platform.OS === 'android' ? "http://10.0.2.2:3000" : "http://localhost:3000",
};

// Para producción (cuando deploys en un servidor)
const PROD_CONFIG = {
  API_BASE_URL: "https://tu-servidor-produccion.com",
};

// Determinar si estamos en desarrollo o producción
const isDevelopment = __DEV__;

// Exportar la configuración apropiada
const config = isDevelopment ? DEV_CONFIG : PROD_CONFIG;

export default config;

// Funciones de utilidad para construir URLs
export const buildApiUrl = (endpoint) => {
  return `${config.API_BASE_URL}${endpoint}`;
};

// URLs específicas de la API
export const API_ENDPOINTS = {
  REGISTER: "/api/register",
  LOGIN: "/api/login",
  PASSWORD_STATUS: "/api/password-status",
  MIGRATE_PASSWORDS: "/api/migrate-passwords",
  MEDICAMENTOS: "/api/medicamentos",
  LOG_DOSE: "/api/log-dose",
};
