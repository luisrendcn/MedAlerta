import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { buildApiUrl, API_ENDPOINTS } from "../config/api";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage("Por favor ingresa email y contraseña");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setMessageType("");
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.LOGIN), {
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

        setMessage(`Bienvenido ${data.paciente.NomPaci}`);
        setMessageType("success");
        setTimeout(() => {
          navigation.reset({ index: 0, routes: [{ name: "Medicamentos" }] });
        }, 2000);
      } else {
        setMessage(data.error || "Credenciales incorrectas");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      setMessage("No se pudo conectar con el servidor. Verifica que el API esté funcionando.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>MedAlerta</Text>
      <Text style={styles.subtitle}>Iniciar Sesión</Text>

      {message ? (
        <Text style={[styles.message, messageType === "success" ? styles.success : styles.error]}>
          {message}
        </Text>
      ) : null}

      {/* Campos */}
      <TextInput
        placeholder="usuario@correo.com"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Contraseña"
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

      {/* Fila de botones secundarios */}
      <View style={styles.row}>
        {/* Botón Registrarse */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.secondaryButtonText}>Registrarse</Text>
        </TouchableOpacity>

        {/* Botón Olvidó contraseña */}
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>¿Olvidó su contraseña?</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        © 2025 MedAlerta. proyecto de Ingenieria de Software.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f7f9fc",
  },
  brand: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
    color: "#1E7CFF",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  message: {
    textAlign: "center",
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
  },
  success: {
    backgroundColor: "#d4edda",
    color: "#155724",
  },
  error: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },

  // 🔵 Botón principal
  loginButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  // 🔵 Botones secundarios en fila
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#E6F0FF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  secondaryButtonText: {
    color: "#007BFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  // Footer
  footer: {
    marginTop: 30,
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
});
