// app/AlertSettingsScreen.js
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import NotificationService from "./NotificationService";

export default function AlertSettingsScreen() {
  const [settings, setSettings] = useState({
    enabled: true,
    repeatIntervalMinutes: 5,
    maxAttempts: 10,
    repeatUntilConfirmed: true,
  });

  useEffect(() => {
    async function load() {
      const s = await NotificationService.getAlertSettings();
      setSettings(s);
    }
    load();
  }, []);

  const save = async () => {
    await NotificationService.saveAlertSettings(settings);
    Alert.alert("Guardado", "Configuración de alertas guardada.");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuración de Alertas</Text>

      <View style={styles.row}>
        <Text>Alertas activas</Text>
        <Switch
          value={settings.enabled}
          onValueChange={(v) => setSettings((s) => ({ ...s, enabled: v }))}
        />
      </View>

      <View style={styles.row}>
        <Text>Intervalo de reintento (min)</Text>
        <TextInput
          keyboardType="numeric"
          style={styles.input}
          value={String(settings.repeatIntervalMinutes)}
          onChangeText={(t) => setSettings((s) => ({ ...s, repeatIntervalMinutes: Number(t) || 1 }))}
        />
      </View>

      <View style={styles.row}>
        <Text>Intentos máximos</Text>
        <TextInput
          keyboardType="numeric"
          style={styles.input}
          value={String(settings.maxAttempts)}
          onChangeText={(t) => setSettings((s) => ({ ...s, maxAttempts: Number(t) || 1 }))}
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveText}>Guardar</Text>
      </TouchableOpacity>

      <Text style={styles.note}>Nota: el volumen es control del dispositivo. Selecciona un tono fuerte si tu dispositivo lo permite.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f7f9fc" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  input: { width: 80, height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, backgroundColor: "#fff" },
  saveBtn: { backgroundColor: "#007BFF", padding: 14, borderRadius: 10, alignItems: "center", marginTop: 20 },
  saveText: { color: "#fff", fontWeight: "700" },
  note: { marginTop: 10, color: "#666", fontSize: 12 },
});
