import * as Notifications from "expo-notifications";
import { Alert } from "react-native";

// Configuración general de las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ✅ Solicita permiso para enviar notificaciones
export async function pedirPermisoNotificaciones() {
  try {
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
    console.error("Error al pedir permisos de notificaciones:", error);
    return false;
  }
}

// ✅ Programa una notificación
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

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "💊 Recordatorio de Medicamento",
        body: `Es hora de tomar tu medicamento: ${nombre}`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: horaNotificacion,
    });

    console.log("✅ Notificación programada con ID:", id);
    return id;
  } catch (error) {
    console.error("Error al programar recordatorio:", error);
    return null;
  }
}

// ✅ Cancela una notificación específica
export async function cancelarRecordatorio(id) {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
    console.log("🗑️ Notificación cancelada:", id);
  } catch (error) {
    console.error("Error al cancelar recordatorio:", error);
  }
}
