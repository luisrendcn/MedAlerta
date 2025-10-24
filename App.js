import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";

import AppNavigator from "./app/AppNavigator";
import { API_ENDPOINTS, buildApiUrl } from "./config/api";

const Stack = createNativeStackNavigator();

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
    // ✅ Solicitar permisos de notificaciones
    const prepararNotificaciones = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Por favor, habilita las notificaciones para recibir recordatorios.");
      }
    };
    prepararNotificaciones();

    // ✅ Configurar categorías de acciones
    Notifications.setNotificationCategoryAsync("medicamento", [
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

    // ✅ Listener de respuestas
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { notification, actionIdentifier } = response;
        const data = notification.request.content.data;

        if (actionIdentifier === "confirmar") {
          fetch(buildApiUrl(API_ENDPOINTS.LOG_DOSE), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idMedica: data.idMedica, estado: "atendida" }),
          }).catch((error) => console.error("Error logging dose:", error));

          Notifications.dismissNotificationAsync(notification.request.identifier);
        } else if (actionIdentifier === "posponer") {
          Notifications.dismissNotificationAsync(notification.request.identifier);
          const now = new Date();
          now.setMinutes(now.getMinutes() + 5);
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
    );

    return () => {
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  // ✅ Usa directamente tu AppNavigator centralizado
  return <AppNavigator />;
}
