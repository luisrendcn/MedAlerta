import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";

import AppNavigator from "./app/AppNavigator";
import { API_ENDPOINTS, buildApiUrl } from "./config/api";

// Configurar el manejador global de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  useEffect(() => {
    // Solicitar permisos y configurar categorías sólo en plataformas nativas
    const prepararNotificaciones = async () => {
      try {
        if (Platform.OS !== "web" && Notifications.requestPermissionsAsync) {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== "granted") {
            alert(
              "Por favor, habilita las notificaciones para recibir recordatorios."
            );
          }
        }

        // Configurar categorías sólo si la API está disponible (no en web)
        if (
          Platform.OS !== "web" &&
          typeof Notifications.setNotificationCategoryAsync === "function"
        ) {
          await Notifications.setNotificationCategoryAsync("medicamento", [
            {
              identifier: "confirmar",
              buttonTitle: "Confirmar Toma",
              options: { opensAppToForeground: false },
            },
            {
              identifier: "posponer",
              buttonTitle: "Posponer 5 min",
              options: { opensAppToForeground: false },
            },
          ]);
        }
      } catch (err) {
        // Evitar que el app se rompa en plataformas donde algunas APIs no existen
        console.warn(
          "Notificaciones: no se pudo configurar completamente",
          err.message || err
        );
      }
    };
    prepararNotificaciones();

    // Registrar listener de respuestas solo en plataformas nativas
    let responseListener;
    if (
      Platform.OS !== "web" &&
      typeof Notifications.addNotificationResponseReceivedListener ===
        "function"
    ) {
      responseListener = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const { notification, actionIdentifier } = response;
          const data = notification.request.content.data;

          if (actionIdentifier === "confirmar") {
            fetch(buildApiUrl(API_ENDPOINTS.LOG_DOSE), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                idMedica: data.idMedica,
                estado: "atendida",
              }),
            }).catch((error) => console.error("Error logging dose:", error));

            if (typeof Notifications.dismissNotificationAsync === "function") {
              Notifications.dismissNotificationAsync(
                notification.request.identifier
              ).catch(() => {});
            }
          } else if (actionIdentifier === "posponer") {
            if (typeof Notifications.dismissNotificationAsync === "function") {
              Notifications.dismissNotificationAsync(
                notification.request.identifier
              ).catch(() => {});
            }
            const now = new Date();
            now.setMinutes(now.getMinutes() + 5);
            if (typeof Notifications.scheduleNotificationAsync === "function") {
              Notifications.scheduleNotificationAsync({
                content: {
                  title: "Recordatorio de Medicamento",
                  body: `Toma tu dosis de ${data.nombre}`,
                  data: data,
                  categoryIdentifier: "medicamento",
                  sound: "alarm.mp3",
                },
                trigger: { date: now },
              }).catch((error) =>
                console.error("Error scheduling postponed notification:", error)
              );
            }
          }
        }
      );
    }

    return () => {
      try {
        if (responseListener && typeof responseListener.remove === "function") {
          responseListener.remove();
        } else if (
          responseListener &&
          typeof responseListener.removeSubscription === "function"
        ) {
          responseListener.removeSubscription();
        }
      } catch (cleanupErr) {
        console.warn(
          "Error al limpiar listener de notificaciones:",
          cleanupErr.message || cleanupErr
        );
      }
    };
  }, []);

  // ✅ Usa directamente tu AppNavigator centralizado
  return <AppNavigator />;
}
