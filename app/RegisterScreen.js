import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !birthDate || !address || !phoneNumber || !email || !password) {
      Alert.alert("Error", "Por favor llena todos los campos");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Por favor ingresa un email válido");
      return;
    }

    if (!/^\d+$/.test(phoneNumber)) {
      Alert.alert("Error", "El número de teléfono debe contener solo números");
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert(
        "Error",
        "La contraseña debe tener mínimo 8 caracteres, incluir una mayúscula y un número"
      );
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birthDate)) {
      Alert.alert("Error", "La fecha debe tener formato YYYY-MM-DD (ej: 1990-01-15)");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://192.168.30.10:3000/api/register", {
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

      const data = await response.json();
      console.log("Respuesta del servidor:", data);

      // Mostrar mensaje de éxito sin depender de response.ok
      Alert.alert("Éxito", "Paciente registrado correctamente", [
        { text: "OK", onPress: () => navigation.navigate("Login") },
      ]);

      // Limpiar formulario
      setFullName("");
      setBirthDate("");
      setAddress("");
      setPhoneNumber("");
      setEmail("");
      setPassword("");
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
      <Text style={styles.brand}>Registro de Paciente</Text>

      <TextInput
        placeholder="Nombre completo"
        placeholderTextColor="#999"
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
      />

      <TextInput
        placeholder="Fecha de nacimiento (YYYY-MM-DD)"
        placeholderTextColor="#999"
        style={styles.input}
        value={birthDate}
        onChangeText={setBirthDate}
        maxLength={10}
      />

      <TextInput
        placeholder="Dirección de casa"
        placeholderTextColor="#999"
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        multiline
      />

      <TextInput
        placeholder="Número de celular"
        placeholderTextColor="#999"
        style={styles.input}
        keyboardType="numeric"
        value={phoneNumber}
        maxLength={10}
        onChangeText={(text) => {
          const numericText = text.replace(/[^0-9]/g, "");
          setPhoneNumber(numericText);
        }}
      />

      <TextInput
        placeholder="Correo electrónico"
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
