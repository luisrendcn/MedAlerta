import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
      const response = await fetch("http://localhost:3000/api/password-status");
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
        "http://localhost:3000/api/migrate-passwords",
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
      <Text style={styles.title}>Panel de Superusuario ⚙️</Text>

      <View style={styles.buttonContainer}>
        {/* Botones existentes */}
        <TouchableOpacity
          style={styles.utilityBtn}
          onPress={checkPasswordStatus}
        >
          <Text style={styles.utilityBtnText}>🔍 Verificar Contraseñas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.utilityBtn} onPress={migratePasswords}>
          <Text style={styles.utilityBtnText}>🔐 Encriptar Contraseñas</Text>
        </TouchableOpacity>

        {/* NUEVOS BOTONES */}
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.navigate("MedicineForm")}
        >
          <Text style={styles.navBtnText}>➕ Agregar Medicamento</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.navigate("MedicineList")}
        >
          <Text style={styles.navBtnText}>📋 Lista de Medicamentos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.navigate("DoseHistory")}
        >
          <Text style={styles.navBtnText}>⏱ Historial de Dosis</Text>
        </TouchableOpacity>

        {/* Botón de cerrar sesión */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Cerrar Sesión</Text>
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
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  buttonContainer: {
    width: "80%",
    gap: 12,
  },
  utilityBtn: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  utilityBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  navBtn: {
    backgroundColor: "#28A745",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  navBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  logoutBtn: {
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  logoutBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
});
