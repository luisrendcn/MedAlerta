import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_ENDPOINTS, buildApiUrl } from "../config/api";

export default function CaregiverAddPatientScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert("Falta nombre", "Ingresa el nombre del paciente");
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("cuidadorToken");
      const resp = await fetch(buildApiUrl(API_ENDPOINTS.CUIDADOR_PACIENTES), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ NomPaci: name, Email: email || undefined }),
      });
      const data = await resp.json();
      if (resp.ok) {
        Alert.alert("Listo", "Paciente creado en memoria", [{ text: "OK", onPress: () => navigation.goBack() }]);
      } else if (resp.status === 401) {
        navigation.reset({ index: 0, routes: [{ name: "CaregiverLogin" }] });
      } else {
        Alert.alert("Error", data.error || "No se pudo crear");
      }
    } catch (_e) {
      Alert.alert("Error", "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nuevo Paciente</Text>
      <TextInput placeholder="Nombre completo" style={styles.input} value={name} onChangeText={setName} />
      <TextInput placeholder="Email (opcional)" style={styles.input} value={email} onChangeText={setEmail} />
      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={save} disabled={loading}>
        <Text style={styles.btnText}>{loading ? "Guardando..." : "Guardar"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f7f9fc" },
  title: { fontSize: 22, fontWeight: "700", color: "#333", marginBottom: 12 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e1e5e9",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  btn: { backgroundColor: "#7A57D1", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  btnDisabled: { backgroundColor: "#b0a0de" },
  btnText: { color: "#fff", fontWeight: "700" },
});


