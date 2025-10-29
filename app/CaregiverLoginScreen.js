import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_ENDPOINTS, buildApiUrl } from "../config/api";

export default function CaregiverLoginScreen({ navigation }) {
  const [email, setEmail] = useState("cuidador@medalerta.com");
  const [password, setPassword] = useState("123456");
  const [nombre, setNombre] = useState("Cuidador Demo");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage("Ingresa email y contraseña");
      setMessageType("error");
      return;
    }
    setLoading(true);
    setMessage("");
    setMessageType("");
    try {
      const resp = await fetch(buildApiUrl(API_ENDPOINTS.CUIDADOR_LOGIN), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          Email: email, 
          Contrasenia: password,
          NomCuidador: nombre || undefined
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setMessage(data.error || "Credenciales inválidas");
        setMessageType("error");
        return;
      }

      await AsyncStorage.setItem("cuidadorToken", data.token);
      await AsyncStorage.setItem("cuidadorInfo", JSON.stringify(data.cuidador));
      navigation.reset({ index: 0, routes: [{ name: "CaregiverDashboard" }] });
    } catch (_e) {
      setMessage("No se pudo conectar con el servidor");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>MedAlerta</Text>
      <Text style={styles.subtitle}>Acceso de Cuidador</Text>
      <Text style={styles.info}>Usa los datos predeterminados o ingresa cualquier email/contraseña</Text>

      {message ? (
        <Text style={[styles.message, messageType === "success" ? styles.success : styles.error]}>
          {message}
        </Text>
      ) : null}

      <TextInput
        placeholder="Tu nombre (opcional)"
        placeholderTextColor="#999"
        style={styles.input}
        value={nombre}
        onChangeText={setNombre}
      />
      <TextInput
        placeholder="Cualquier email (ej: cuidador@test.com)"
        placeholderTextColor="#999"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Cualquier contraseña"
        placeholderTextColor="#999"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={[styles.loginButton, loading && styles.loginButtonDisabled]} onPress={handleLogin} disabled={loading}>
        <Text style={styles.loginButtonText}>{loading ? "Ingresando..." : "Entrar"}</Text>
      </TouchableOpacity>

      {/* Botones de ayuda */}
      <View style={styles.helpButtons}>
        <TouchableOpacity 
          style={styles.helpButton} 
          onPress={() => {
            setEmail("cuidador@medalerta.com");
            setPassword("123456");
            setNombre("Cuidador Demo");
          }}
        >
          <Text style={styles.helpButtonText}>Usar datos predeterminados</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.helpButton} 
          onPress={() => {
            setEmail("");
            setPassword("");
            setNombre("");
          }}
        >
          <Text style={styles.helpButtonText}>Limpiar campos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 40, backgroundColor: "#f7f9fc" },
  brand: { fontSize: 32, fontWeight: "700", textAlign: "center", marginBottom: 8, color: "#1E7CFF" },
  subtitle: { fontSize: 18, fontWeight: "500", textAlign: "center", marginBottom: 8, color: "#666" },
  info: { fontSize: 14, textAlign: "center", marginBottom: 32, color: "#888", fontStyle: "italic" },
  message: { textAlign: "center", marginBottom: 12, padding: 10, borderRadius: 8 },
  success: { backgroundColor: "#d4edda", color: "#155724" },
  error: { backgroundColor: "#f8d7da", color: "#721c24" },
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
    backgroundColor: "#7A57D1",
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
  loginButtonDisabled: { backgroundColor: "#cccccc" },
  loginButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  helpButtons: { marginTop: 20, gap: 8 },
  helpButton: { 
    backgroundColor: "#E6F0FF", 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 8, 
    alignItems: "center" 
  },
  helpButtonText: { color: "#7A57D1", fontSize: 14, fontWeight: "600" },
});


