import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { buildApiUrl, API_ENDPOINTS } from "../config/api";

export default function DashboardScreen({ navigation }) {
  const handleLogout = async () => {
    await AsyncStorage.removeItem("paciente");
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  const checkPasswordStatus = async () => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.PASSWORD_STATUS));
      const data = await response.json();

      Alert.alert(
        "Estado de Contraseñas",
        `Total pacientes: ${data.totalPacientes}\n` +
          `Contraseñas encriptadas: ${data.contraseñasEncriptadas}\n` +
          `Contraseñas sin encriptar: ${data.contraseñasSinEncriptar}`
      );
    } catch (_error) {
      Alert.alert("Error", "No se pudo verificar el estado de las contraseñas");
    }
  };

  const migratePasswords = async () => {
    try {
      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.MIGRATE_PASSWORDS),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      Alert.alert(
        "Migración Completada",
        `${data.message}\n` +
          `Total pacientes: ${data.totalPacientes}\n` +
          `Contraseñas migradas: ${data.contraseñasMigradas}`
      );
    } catch (_error) {
      Alert.alert("Error", "No se pudo completar la migración");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido a MedAlerta 🎉</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.utilityBtn}
          onPress={checkPasswordStatus}
        >
          <Text style={styles.utilityBtnText}>🔍 Verificar Contraseñas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.utilityBtn} onPress={migratePasswords}>
          <Text style={styles.utilityBtnText}>🔐 Encriptar Contraseñas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={handleLogout}>
          <Text style={styles.btnText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f9fc",
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#333" },
  buttonContainer: {
    width: "80%",
    gap: 15,
  },
  utilityBtn: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  utilityBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  btn: {
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
  },
});
