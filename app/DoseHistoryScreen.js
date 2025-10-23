import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { obtenerHistorialTomas } from "./NotificationService";

export default function DoseHistoryScreen({ navigation }) {
  const [historial, setHistorial] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    hoy: 0,
    ultima: null,
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const historialData = await obtenerHistorialTomas();

      const historialOrdenado = historialData.sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      );

      setHistorial(historialOrdenado);
      calcularEstadisticas(historialOrdenado);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      Alert.alert("Error", "No se pudo cargar el historial de tomas.");
    }
  };

  const calcularEstadisticas = (data) => {
    const total = data.length;
    const hoy = data.filter((toma) => {
      const fecha = new Date(toma.fecha);
      const hoy = new Date();
      return (
        fecha.getDate() === hoy.getDate() &&
        fecha.getMonth() === hoy.getMonth() &&
        fecha.getFullYear() === hoy.getFullYear()
      );
    }).length;
    const ultima = data[0] || null;

    setStats({ total, hoy, ultima });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  };

  const eliminarTomaHistorial = (toma) => {
    Alert.alert(
      "🗑️ Eliminar Toma",
      `¿Deseas eliminar la toma de ${toma.nombre}?\n\nFecha: ${formatearFecha(
        toma.fecha
      )}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => handleEliminarToma(toma.id),
        },
      ]
    );
  };

  const handleEliminarToma = async (id) => {
    try {
      const data = await obtenerHistorialTomas();
      const nuevoHistorial = data.filter((toma) => toma.id !== id);
      await AsyncStorage.setItem("historialTomas", JSON.stringify(nuevoHistorial));
      await cargarDatos();
      Alert.alert("✅ Eliminada", "La toma fue eliminada exitosamente.");
    } catch (error) {
      console.error("Error al eliminar toma:", error);
      Alert.alert("❌ Error", "Hubo un problema al eliminar la toma.");
    }
  };

  const formatearFecha = (fechaISO) => {
    try {
      const fecha = new Date(fechaISO);
      return fecha.toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "Fecha no válida";
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={styles.medicineInfo}>
        <Text style={styles.medicineName}>{item.nombre}</Text>
        <Text style={styles.dateInfo}>{formatearFecha(item.fecha)}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => eliminarTomaHistorial(item)}
      >
        <Text style={styles.deleteText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de Tomas</Text>

      {/* 📊 Sección de estadísticas con íconos */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>💊</Text>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statValue}>{stats.total}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>⏰</Text>
          <Text style={styles.statLabel}>Hoy</Text>
          <Text style={styles.statValue}>{stats.hoy}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>📅</Text>
          <Text style={styles.statLabel}>Última</Text>
          <Text style={styles.statValue}>
            {stats.ultima ? formatearFecha(stats.ultima.fecha) : "-"}
          </Text>
        </View>
      </View>

      {historial.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay tomas registradas aún.</Text>
          <Text style={styles.emptySubtext}>
            Registra tus primeras tomas desde la lista de medicamentos.
          </Text>
        </View>
      ) : (
        <FlatList
          data={historial}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 30,
    marginBottom: 10,
    color: "#333",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#777",
  },
  statValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginTop: 3,
    textAlign: "center",
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  dateInfo: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  deleteButton: {
    backgroundColor: "#ff4d4d",
    padding: 12,
    borderRadius: 10,
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: {
    color: "#fff",
    fontSize: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "#6C757D",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
