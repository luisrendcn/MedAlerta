// config/notificationService.js
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configura el comportamiento de las notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ✅ Configurar listener para notificaciones recibidas
export function configurarListenerNotificaciones() {
  const subscription = Notifications.addNotificationReceivedListener(notification => {
    console.log("Notificación recibida:", notification);
  });

  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log("Respuesta a notificación:", response);
  });

  return () => {
    subscription.remove();
    responseSubscription.remove();
  };
}

// ✅ Solicitar permisos de notificaciones
export async function pedirPermisoNotificaciones() {
  try {
    if (!Device.isDevice) {
      console.log("Las notificaciones solo funcionan en un dispositivo físico.");
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  } catch (error) {
    console.error("Error al pedir permisos de notificación:", error);
    return false;
  }
}

// ✅ Función para interpretar hora tipo "08:30 AM" o "20:15"
function obtenerHoraMinuto(horarioStr) {
  try {
    const match = horarioStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
    if (!match) return null;

    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const meridian = match[3]?.toLowerCase();

    if (meridian === "pm" && hour !== 12) hour += 12;
    if (meridian === "am" && hour === 12) hour = 0;

    return { hour, minute };
  } catch {
    return null;
  }
}

// ✅ Programar recordatorio diario
export async function programarRecordatorio(nombre, horarioStr) {
  try {
    const hora = obtenerHoraMinuto(horarioStr);
    if (!hora) {
      console.warn("Formato de hora no válido:", horarioStr);
      return null;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "💊 Recordatorio de medicamento",
        body: `Es hora de tomar ${nombre}.`,
        sound: "default",
      },
      trigger: { hour: hora.hour, minute: hora.minute, repeats: true },
    });

    console.log("Notificación programada con ID:", id);
    return id;
  } catch (error) {
    console.error("Error al programar recordatorio:", error);
    return null;
  }
}

// ✅ Cancelar un recordatorio
export async function cancelarRecordatorio(id) {
  try {
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      console.log("Notificación cancelada:", id);
    }
  } catch (error) {
    console.error("Error al cancelar recordatorio:", error);
  }
}

// ✅ Registrar una toma de medicamento
export async function registrarToma(medicamentoId, medicamentoNombre, dosis) {
  try {
    const toma = {
      id: Date.now(),
      medicamentoId,
      medicamentoNombre,
      dosis,
      fecha: new Date().toISOString(),
      timestamp: Date.now(),
    };

    const historial = await obtenerHistorialTomas();
    historial.push(toma);
    
    await AsyncStorage.setItem("@historial_tomas", JSON.stringify(historial));
    console.log("Toma registrada:", toma);
    return toma;
  } catch (error) {
    console.error("Error al registrar toma:", error);
    return null;
  }
}

// ✅ Obtener historial de tomas
export async function obtenerHistorialTomas() {
  try {
    const data = await AsyncStorage.getItem("@historial_tomas");
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error al obtener historial:", error);
    return [];
  }
}

// ✅ Obtener tomas de un medicamento específico
export async function obtenerTomasPorMedicamento(medicamentoId) {
  try {
    const historial = await obtenerHistorialTomas();
    return historial.filter(toma => toma.medicamentoId === medicamentoId);
  } catch (error) {
    console.error("Error al obtener tomas del medicamento:", error);
    return [];
  }
}

// ✅ Eliminar una toma del historial
export async function eliminarToma(tomaId) {
  try {
    const historial = await obtenerHistorialTomas();
    const nuevoHistorial = historial.filter(toma => toma.id !== tomaId);
    await AsyncStorage.setItem("@historial_tomas", JSON.stringify(nuevoHistorial));
    console.log("Toma eliminada:", tomaId);
    return true;
  } catch (error) {
    console.error("Error al eliminar toma:", error);
    return false;
  }
}

// ✅ Obtener estadísticas de tomas
export async function obtenerEstadisticasTomas() {
  try {
    const historial = await obtenerHistorialTomas();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const tomasHoy = historial.filter(toma => {
      const fechaToma = new Date(toma.fecha);
      fechaToma.setHours(0, 0, 0, 0);
      return fechaToma.getTime() === hoy.getTime();
    });

    const tomasEstaSemana = historial.filter(toma => {
      const fechaToma = new Date(toma.fecha);
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(hoy.getDate() - hoy.getDay());
      return fechaToma >= inicioSemana;
    });

    return {
      totalTomas: historial.length,
      tomasHoy: tomasHoy.length,
      tomasEstaSemana: tomasEstaSemana.length,
      ultimaToma: historial.length > 0 ? historial[historial.length - 1] : null,
    };
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return {
      totalTomas: 0,
      tomasHoy: 0,
      tomasEstaSemana: 0,
      ultimaToma: null,
    };
  }
}