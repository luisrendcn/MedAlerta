import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Platform } from "react-native";

// Nota: no importamos 'expo-notifications' en top-level para evitar warnings en web.
async function getNotifications() {
  if (Platform.OS === 'web') return null;
  const Notifications = await import('expo-notifications');
  return Notifications;
}

/* ==========================================================
   ⚙️ CONFIGURACIÓN GENERAL DE NOTIFICACIONES
========================================================== */
// Configurar handler sólo en plataformas nativas
(async () => {
  try {
    const Notifications = await getNotifications();
    if (Notifications && Notifications.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    }
  } catch (err) {
    console.warn('NotificationService: no se pudo establecer handler (posible web):', err && err.message);
  }
})();

/* ==========================================================
   🟢 SOLICITAR PERMISOS DE NOTIFICACIÓN
========================================================== */
export async function pedirPermisoNotificaciones() {
  if (Platform.OS === 'web') return false; // no aplicable en web
  try {
    const Notifications = await getNotifications();
    if (!Notifications || !Notifications.requestPermissionsAsync) return false;
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permisos requeridos",
        "Por favor activa las notificaciones para recibir recordatorios."
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error("❌ Error al pedir permisos de notificaciones:", error);
    return false;
  }
}

/* ==========================================================
   🕒 PROGRAMAR RECORDATORIO (con sonido personalizado)
========================================================== */
export async function programarRecordatorio(nombre, horario) {
  try {
    const [horaStr, minutoStr] = horario.replace(/[^0-9:]/g, "").split(":");
    const hora = parseInt(horaStr);
    const minuto = parseInt(minutoStr);

    if (isNaN(hora) || isNaN(minuto)) {
      throw new Error("Formato de hora no válido. Usa algo como 08:30");
    }

    const ahora = new Date();
    const horaNotificacion = new Date();
    horaNotificacion.setHours(hora);
    horaNotificacion.setMinutes(minuto);
    horaNotificacion.setSeconds(0);

    // Si ya pasó la hora de hoy, se programa para mañana
    if (horaNotificacion <= ahora) {
      horaNotificacion.setDate(horaNotificacion.getDate() + 1);
    }

    if (Platform.OS === 'web') {
      console.warn('programarRecordatorio: notificaciones no soportadas en web');
      return null;
    }
    const Notifications = await getNotifications();
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "💊 Recordatorio de Medicamento",
        body: `Es hora de tomar tu medicamento: ${nombre}`,
        sound: Platform.select({
          ios: "alarm.mp3",
          android: "alarm.mp3",
        }),
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: horaNotificacion,
    });

    console.log("✅ Notificación programada con ID:", id);
    return id;
  } catch (error) {
    console.error("❌ Error al programar recordatorio:", error);
    return null;
  }
}

/* ==========================================================
   🧹 CANCELAR RECORDATORIO
========================================================== */
export async function cancelarRecordatorio(id) {
  try {
    if (Platform.OS === 'web') return false;
    const Notifications = await getNotifications();
    if (!Notifications || !Notifications.cancelScheduledNotificationAsync) return false;
    await Notifications.cancelScheduledNotificationAsync(id);
    console.log("🗑️ Notificación cancelada:", id);
    return true;
  } catch (error) {
    console.error("❌ Error al cancelar recordatorio:", error);
    return false;
  }
}

/* ==========================================================
   📋 OBTENER HISTORIAL DE TOMAS
========================================================== */
export async function obtenerHistorialTomas() {
  try {
    const historial = await AsyncStorage.getItem("historialTomas");
    return historial ? JSON.parse(historial) : [];
  } catch (error) {
    console.error("❌ Error al obtener historial:", error);
    return [];
  }
}

/* ==========================================================
   ✍️ REGISTRAR TOMA EN EL HISTORIAL
========================================================== */
export async function registrarToma(medicamento) {
  try {
    const data = await AsyncStorage.getItem("historialTomas");
    let historial = data ? JSON.parse(data) : [];

    const nuevaToma = {
      id: Date.now(),
      medicamentoNombre: medicamento.nombre,
      dosis: medicamento.dosis || "No especificada",
      fecha: new Date().toISOString(),
    };

    historial.push(nuevaToma);
    await AsyncStorage.setItem("historialTomas", JSON.stringify(historial));

    console.log("✅ Toma registrada correctamente:", nuevaToma);
  } catch (error) {
    console.error("❌ Error al registrar toma:", error);
    throw error;
  }
}

/* ==========================================================
   🗑️ ELIMINAR TOMA DEL HISTORIAL
========================================================== */
export async function eliminarToma(id) {
  try {
    const data = await AsyncStorage.getItem("historialTomas");
    if (!data) return false;

    const historial = JSON.parse(data);
    const nuevoHistorial = historial.filter((toma) => toma.id !== id);

    await AsyncStorage.setItem("historialTomas", JSON.stringify(nuevoHistorial));
    console.log("🗑️ Toma eliminada:", id);
    return true;
  } catch (error) {
    console.error("❌ Error al eliminar toma:", error);
    return false;
  }
}

/* ==========================================================
   📊 OBTENER ESTADÍSTICAS DE TOMAS
========================================================== */
export async function obtenerEstadisticasTomas() {
  try {
    const historial = await obtenerHistorialTomas();
    if (!historial || historial.length === 0) {
      return { totalTomas: 0, tomasHoy: 0, tomasEstaSemana: 0, ultimaToma: null };
    }

    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());

    const totalTomas = historial.length;
    const tomasHoy = historial.filter(
      (t) => new Date(t.fecha).toDateString() === hoy.toDateString()
    ).length;

    const tomasEstaSemana = historial.filter(
      (t) => new Date(t.fecha) >= inicioSemana
    ).length;

    const ultimaToma = historial.reduce((a, b) =>
      new Date(a.fecha) > new Date(b.fecha) ? a : b
    );

    return { totalTomas, tomasHoy, tomasEstaSemana, ultimaToma };
  } catch (error) {
    console.error("❌ Error al obtener estadísticas:", error);
    return { totalTomas: 0, tomasHoy: 0, tomasEstaSemana: 0, ultimaToma: null };
  }
}
