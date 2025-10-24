import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_ENDPOINTS, buildApiUrl } from "../config/api";

export default function RegisterScreen() {
  const navigation = useNavigation();
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRegister = async () => {
    if (
      !fullName ||
      !birthDate ||
      !address ||
      !phoneNumber ||
      !email ||
      !password
    ) {
      Alert.alert("Error", "Por favor completa todos los campos.");
      return;
    }

    setErrorMessage("");
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.REGISTER), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          NomPaci: fullName,
          FeNaci: birthDate,
          DireCasa: address,
          NumCel: parseInt(phoneNumber),
          Email: email,
          Contraseña: password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        // Mensaje de éxito y redirección
        Alert.alert(
          "Registro exitoso",
          "¡Registro exitoso! Por favor, inicia sesión.",
          [{ text: "OK", onPress: () => navigation.navigate("Login") }]
        );
      } else {
        const msg =
          data.error ||
          data.message ||
          JSON.stringify(data) ||
          "No se pudo registrar el usuario.";
        setErrorMessage(msg);
        Alert.alert("Error", msg);
      }
    } catch (error) {
      console.error("Error en el registro:", error);
      const msg = error.message || "No se pudo conectar con el servidor.";
      setErrorMessage(msg);
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Registro de Usuario</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre completo"
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={styles.input}
        placeholder="Fecha de nacimiento (YYYY-MM-DD)"
        value={birthDate}
        onChangeText={setBirthDate}
      />
      <TextInput
        style={styles.input}
        placeholder="Dirección"
        value={address}
        onChangeText={setAddress}
      />
      <TextInput
        style={styles.input}
        placeholder="Número de celular"
        value={phoneNumber}
        keyboardType="numeric"
        onChangeText={setPhoneNumber}
      />
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        keyboardType="email-address"
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, loading ? styles.buttonDisabled : null]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Cargando...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Registrarse</Text>
        )}
      </TouchableOpacity>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>¿Ya tienes una cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#1E90FF",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#1E90FF",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  link: {
    color: "#1E90FF",
    marginTop: 15,
    fontSize: 16,
  },
});
