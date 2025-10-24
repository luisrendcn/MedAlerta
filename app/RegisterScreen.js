import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_ENDPOINTS, buildApiUrl } from "../config/api";

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"

  const handleRegister = async () => {
    // Validar que todos los campos estén llenos
    if (
      !fullName ||
      !birthDate ||
      !address ||
      !phoneNumber ||
      !email ||
      !password
    ) {
      Alert.alert("Error", "Por favor llena todos los campos");
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Por favor ingresa un email válido");
      return;
    }

    // Validar número de teléfono (solo números)
    if (!/^\d+$/.test(phoneNumber)) {
      Alert.alert("Error", "El número de teléfono debe contener solo números");
      return;
    }

    // Validar contraseña: mínimo 8 caracteres, al menos una mayúscula y un número
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert(
        "Error",
        "La contraseña debe tener mínimo 8 caracteres, incluir una mayúscula y un número"
      );
      return;
    }

    // Validar formato de fecha (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birthDate)) {
      Alert.alert(
        "Error",
        "La fecha debe tener formato YYYY-MM-DD (ej: 1990-01-15)"
      );
      return;
    }

    setLoading(true);
    setMessage("");
    setMessageType("");
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.REGISTER), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          NomPaci: fullName,
          FeNaci: birthDate,
          DireCasa: address,
          NumCel: parseInt(phoneNumber),
          Email: email,
          Contraseña: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("¡Registro exitoso! Por favor, inicia sesión.");
        setMessageType("success");
        setTimeout(() => {
          navigation.navigate("Login");
        }, 2000);
      } else {
        setMessage(data.error || "Error al registrar paciente");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      setMessage(
        "No se pudo conectar con el servidor. Verifica que el API esté funcionando."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Registro de Paciente</Text>

      {message ? (
        <Text
          style={[
            styles.message,
            messageType === "success" ? styles.success : styles.error,
          ]}
        >
          {message}
        </Text>
      ) : null}

      <TextInput
        placeholder="Nombre completo"
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
      />

      <TextInput
        placeholder="Fecha de nacimiento (YYYY-MM-DD)"
        style={styles.input}
        value={birthDate}
        onChangeText={setBirthDate}
        maxLength={10}
      />

      <TextInput
        placeholder="Dirección de casa"
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        multiline
      />

      <TextInput
        placeholder="Número de celular"
        style={styles.input}
        keyboardType="numeric"
        value={phoneNumber}
        onChangeText={(text) => {
          // Solo permite números
          const numericText = text.replace(/[^0-9]/g, "");
          setPhoneNumber(numericText);
        }}
      />

      <TextInput
        placeholder="Correo electrónico"
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

      <TouchableOpacity
        style={[styles.btnPrimary, loading && styles.btnDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.btnText}>
          {loading ? "Registrando..." : "Registrar Paciente"}
        </Text>
      </TouchableOpacity>
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
  btnPrimary: {
    backgroundColor: "#1E7CFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 6,
  },
  btnDisabled: { backgroundColor: "#cccccc" },
  btnText: { color: "#fff", fontWeight: "700" },
});
