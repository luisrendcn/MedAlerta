import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import AppNavigator from "./app/AppNavigator";

export default function App() {
  useEffect(() => {
    const prepararNotificaciones = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Por favor, habilita las notificaciones para recibir recordatorios.");
      }
    };
    prepararNotificaciones();
  }, []);

  return <AppNavigator />;
}
