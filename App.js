
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import {
  addNotificationResponseReceivedListener,
  cancelScheduledNotificationAsync,
  dismissNotificationAsync,
  removeNotificationSubscription,
  scheduleNotificationAsync,
  setNotificationCategoryAsync,
  setNotificationHandler,
} from 'expo-notifications';
import MedicamentosScreen from './app/MedicamentosScreen';
import LoginScreen from './app/LoginScreen';
import RegisterScreen from './app/RegisterScreen';
import { buildApiUrl, API_ENDPOINTS } from './config/api';

const Stack = createNativeStackNavigator();

import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import AppNavigator from "./app/AppNavigator";


setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  useEffect(() => {
 
    // Configurar categoría de notificaciones
    setNotificationCategoryAsync('medicamento', [
      {
        identifier: 'confirmar',
        buttonTitle: 'Confirmar Toma',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: 'posponer',
        buttonTitle: 'Posponer 5 min',
        options: {
          opensAppToForeground: false,
        },
      },
    ]);

    // Listener para respuestas de notificaciones
    const responseListener = addNotificationResponseReceivedListener(response => {
      const { notification, actionIdentifier } = response;
      const data = notification.request.content.data;

      if (actionIdentifier === 'confirmar') {
        // Confirmar toma
        fetch(buildApiUrl(API_ENDPOINTS.LOG_DOSE), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idMedica: data.idMedica, estado: 'atendida' }),
        }).catch(error => console.error('Error logging dose:', error));

        dismissNotificationAsync(notification.request.identifier);
        // Cancel followup if this is the first notification
        if (!data.isFollowup) {
          cancelScheduledNotificationAsync(`medicamento-${data.idMedica}-followup`).catch(error => console.error('Error canceling followup:', error));
        }
      } else if (actionIdentifier === 'posponer') {
        // Posponer 5 min
        dismissNotificationAsync(notification.request.identifier);

        const now = new Date();
        now.setMinutes(now.getMinutes() + 5);

        scheduleNotificationAsync({
          content: {
            title: 'Recordatorio de Medicamento',
            body: `Toma tu dosis de ${data.nombre}`,
            data: data,
            categoryIdentifier: 'medicamento',
            sound: 'alarm.mp3',
          },
          trigger: { date: now },
        }).catch(error => console.error('Error scheduling postponed notification:', error));
        // Cancel followup since postponing
        if (!data.isFollowup) {
          cancelScheduledNotificationAsync(`medicamento-${data.idMedica}-followup`).catch(error => console.error('Error canceling followup:', error));
        }
      } else {
        // Notificación presionada sin acción específica, asumir atendida
        fetch(buildApiUrl(API_ENDPOINTS.LOG_DOSE), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idMedica: data.idMedica, estado: 'atendida' }),
        }).catch(error => console.error('Error logging dose:', error));
        // Cancel followup if this is the first notification
        if (!data.isFollowup) {
          cancelScheduledNotificationAsync(`medicamento-${data.idMedica}-followup`).catch(error => console.error('Error canceling followup:', error));
        }
      }
    });

    return () => {
      removeNotificationSubscription(responseListener);
    };
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: 'Registro' }}
        />
        <Stack.Screen
          name="Medicamentos"
          component={MedicamentosScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );

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
