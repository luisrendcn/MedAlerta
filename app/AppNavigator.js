import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AddMedicineScreen from "./AddMedicineScreen"; // 👈 Nueva importación
import DashboardScreen from "./DashboardScreen";
import DoseHistoryScreen from "./DoseHistoryScreen";
import LoginScreen from "./LoginScreen";
import MedicineFormScreen from "./MedicineFormScreen";
import MedicineListScreen from "./MedicineListScreen";
import RegisterScreen from "./RegisterScreen";
import CaregiverLoginScreen from "./CaregiverLoginScreen";
import CaregiverDashboardScreen from "./CaregiverDashboardScreen";
import CaregiverPatientLogsScreen from "./CaregiverPatientLogsScreen";
import CaregiverAddPatientScreen from "./CaregiverAddPatientScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="MedicineList" component={MedicineListScreen} />
        <Stack.Screen name="MedicineForm" component={MedicineFormScreen} />
        <Stack.Screen name="DoseHistory" component={DoseHistoryScreen} />
        <Stack.Screen
          name="AddMedicine"
          component={AddMedicineScreen}
          options={{ title: "Agregar Medicamento" }}
        />
        {/* Cuidadores */}
        <Stack.Screen name="CaregiverLogin" component={CaregiverLoginScreen} />
        <Stack.Screen name="CaregiverDashboard" component={CaregiverDashboardScreen} />
        <Stack.Screen name="CaregiverPatientLogs" component={CaregiverPatientLogsScreen} options={{ headerShown: true, title: "Historial" }} />
        <Stack.Screen name="CaregiverAddPatient" component={CaregiverAddPatientScreen} options={{ headerShown: true, title: "Nuevo Paciente" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
