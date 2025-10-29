import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_ENDPOINTS, buildApiUrl } from "../config/api";

export default function CaregiverPatientLogsScreen({ route, navigation }) {
  const { idPaciente, NomPaci } = route.params;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nota, setNota] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("cuidadorToken");
      const url = buildApiUrl(`${API_ENDPOINTS.CUIDADOR_LOGS_BASE}/${idPaciente}/logs`);
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await resp.json();
      if (resp.ok) setLogs(Array.isArray(data.logs) ? data.logs : []);
      else if (resp.status === 401) navigation.reset({ index: 0, routes: [{ name: "CaregiverLogin" }] });
    } catch (_e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({ title: NomPaci });
    fetchLogs();
  }, [idPaciente]);

  const addLog = async (estado) => {
    try {
      const token = await AsyncStorage.getItem("cuidadorToken");
      const url = buildApiUrl(`${API_ENDPOINTS.CUIDADOR_LOGS_BASE}/${idPaciente}/logs`);
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado, nota }),
      });
      setNota("");
      fetchLogs();
    } catch (_e) {}
  };

  const deletePatient = () => {
    Alert.alert(
      "Eliminar Paciente",
      `¿Estás seguro de que quieres eliminar a ${NomPaci}? Esta acción no se puede deshacer.`,
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("cuidadorToken");
              if (!token) {
                navigation.reset({ index: 0, routes: [{ name: "CaregiverLogin" }] });
                return;
              }

              const url = buildApiUrl(`${API_ENDPOINTS.CUIDADOR_PACIENTE_DELETE}/${idPaciente}`);
              const resp = await fetch(url, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              
              if (resp.ok) {
                Alert.alert("Éxito", "Paciente eliminado correctamente", [
                  { text: "OK", onPress: () => navigation.goBack() }
                ]);
              } else if (resp.status === 401) {
                navigation.reset({ index: 0, routes: [{ name: "CaregiverLogin" }] });
              } else {
                const data = await resp.json();
                Alert.alert("Error", data.error || "No se pudo eliminar el paciente");
              }
            } catch (error) {
              console.error("Error eliminando paciente:", error);
              Alert.alert("Error", "No se pudo conectar con el servidor");
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{new Date(item.ts).toLocaleString()}</Text>
        {item.nota ? <Text style={styles.rowNote}>Nota: {item.nota}</Text> : null}
      </View>
      <View style={[styles.badge, item.estado === "atendida" ? styles.bGreen : item.estado === "no_atendida" ? styles.bRed : styles.bYellow]}>
        <Text style={styles.badgeText}>{item.estado}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <TextInput value={nota} onChangeText={setNota} placeholder="Nota (opcional)" style={styles.input} />
        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={() => addLog("atendida")}>
            <Text style={styles.btnText}>Marcar Tomada</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnRed]} onPress={() => addLog("no_atendida")}>
            <Text style={styles.btnText}>Marcar No tomada</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={deletePatient}>
          <Text style={styles.btnText}>🗑️ Eliminar Paciente</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(_, idx) => String(idx)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchLogs} />}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>Sin registros</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9fc" },
  actions: { padding: 16 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e1e5e9",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  btnRow: { flexDirection: "row", gap: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  btnGreen: { backgroundColor: "#28A745" },
  btnRed: { backgroundColor: "#FF3B30" },
  btnDanger: { backgroundColor: "#DC3545", marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "700" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  rowTitle: { fontWeight: "700", color: "#222" },
  rowNote: { color: "#666", marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  badgeText: { color: "#fff", fontWeight: "700" },
  bGreen: { backgroundColor: "#28A745" },
  bRed: { backgroundColor: "#FF3B30" },
  bYellow: { backgroundColor: "#FFC107" },
  empty: { textAlign: "center", color: "#777", marginTop: 40 },
});


