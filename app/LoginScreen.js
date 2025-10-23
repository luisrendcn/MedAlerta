import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor ingresa email y contraseña");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Email: email,
          Contraseña: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Guardar datos del paciente para uso posterior
        await AsyncStorage.setItem("paciente", JSON.stringify(data.paciente));

        Alert.alert("Éxito", `Bienvenido ${data.paciente.NomPaci}`, [
          {
            text: "OK",
            onPress: () =>
              navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] }),
          },
        ]);
      } else {
        Alert.alert("Error", data.error || "Credenciales incorrectas");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      Alert.alert(
        "Error",
        "No se pudo conectar con el servidor. Verifica que el API esté funcionando."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>MedAlerta</Text>
      <Text style={styles.subtitle}>Iniciar Sesión</Text>

      {/* Campos */}
      <TextInput
        placeholder="usuario@correo.com"
        placeholderTextColor="#999"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Contraseña"
        placeholderTextColor="#999"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* Botón Entrar */}
      <TouchableOpacity
        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.loginButtonText}>
          {loading ? "Iniciando sesión..." : "Entrar"}
        </Text>
      </TouchableOpacity>

      {/* 🔒 Botón pequeño de superusuario */}
      <TouchableOpacity
        onPress={() =>
          navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] })
        }
        style={styles.superUserButton}
      >
        <Text style={styles.superUserText}>Entrar como superusuario</Text>
      </TouchableOpacity>


      {/* Fila de botones secundarios */}
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.secondaryButtonText}>Registrarse</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>¿Olvidó su contraseña?</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        © 2025 MedAlerta. Proyecto de Ingeniería de Software.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 40,
    backgroundColor: "#f7f9fc",
  },
  brand: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    color: "#1E7CFF",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 40,
    color: "#666",
  },
  input: {
    width: "80%",
    height: 50,
    borderWidth: 2,
    borderColor: "#e1e5e9",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
    fontSize: 16,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    width: "80%",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    width: "80%",
    alignSelf: "center",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#E6F0FF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  secondaryButtonText: {
    color: "#007BFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  // 🔹 Botón de superusuario
  superUserButton: {
    alignSelf: "center",
    marginTop: 10,
    opacity: 0.6,
  },
  superUserText: {
    fontSize: 12,
    color: "#999",
    textDecorationLine: "underline",
  },
  footer: {
    marginTop: 30,
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
});
