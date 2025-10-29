import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { API_ENDPOINTS, buildApiUrl } from "../config/api";

export default function CaregiverDashboardScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("cuidadorToken");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "CaregiverLogin" }] });
        return;
      }
      const resp = await fetch(buildApiUrl(API_ENDPOINTS.CUIDADOR_CUMPLIMIENTO), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      if (resp.ok) {
        setItems(Array.isArray(data.pacientes) ? data.pacientes : []);
        setLastUpdated(new Date());
      } else if (resp.status === 401) {
        navigation.reset({ index: 0, routes: [{ name: "CaregiverLogin" }] });
      }
    } catch (_e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60 * 1000); // sincronización cada 60s
    // refrescar al volver a la pantalla (tras crear paciente o añadir notas)
    const unsubscribe = navigation.addListener("focus", fetchData);
    return () => {
      clearInterval(id);
      unsubscribe();
    };
  }, []);

  const headerText = useMemo(() => {
    if (!lastUpdated) return "";
    return `Actualizado: ${lastUpdated.toLocaleTimeString()}`;
  }, [lastUpdated]);

  const logout = async () => {
    await AsyncStorage.removeItem("cuidadorToken");
    await AsyncStorage.removeItem("cuidadorInfo");
    navigation.reset({ index: 0, routes: [{ name: "CaregiverLogin" }] });
  };

  const renderItem = ({ item }) => {
    const badgeColor = item.cumplimiento7d == null
      ? "#999"
      : item.cumplimiento7d >= 80
      ? "#28A745"
      : item.cumplimiento7d >= 50
      ? "#FFC107"
      : "#FF3B30";

    const badgeText = item.cumplimiento7d == null ? "Sin datos" : `${item.cumplimiento7d}%`;

    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("CaregiverPatientLogs", { idPaciente: item.idPaciente, NomPaci: item.NomPaci })}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.NomPaci}</Text>
          {item.Email ? <Text style={styles.cardSub}>{item.Email}</Text> : null}
          <Text style={styles.cardMeta}>Registros 7d: {item.totalRegistros7d}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel del Cuidador</Text>
        <Text style={styles.tempInfo}>Sesión temporal - Acceso sin registro</Text>
        <Text style={styles.updated}>{headerText}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate("CaregiverAddPatient") }>
            <Text style={styles.addBtnText}>➕ Agregar paciente</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.idPaciente)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay pacientes asignados o no hay datos.</Text>
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9fc" },
  header: { paddingTop: 40, paddingHorizontal: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: "700", color: "#333" },
  tempInfo: { fontSize: 12, color: "#7A57D1", marginTop: 4, fontStyle: "italic" },
  updated: { fontSize: 12, color: "#777", marginTop: 2 },
  headerActions: { marginTop: 8 },
  addBtn: { backgroundColor: "#7A57D1", paddingVertical: 8, paddingHorizontal: 12, alignSelf: "flex-start", borderRadius: 8 },
  addBtnText: { color: "#fff", fontWeight: "700" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#222" },
  cardSub: { fontSize: 12, color: "#666", marginTop: 2 },
  cardMeta: { fontSize: 12, color: "#888", marginTop: 6 },
  badge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { color: "#fff", fontWeight: "700" },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: "#eee" },
  logoutBtn: { backgroundColor: "#FF3B30", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  logoutText: { color: "#fff", fontWeight: "700" },
  empty: { textAlign: "center", color: "#777", marginTop: 40 },
});


