import { useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import {
  eliminarToma,
  obtenerEstadisticasTomas,
  obtenerHistorialTomas,
} from "./NotificationService";

export default function DoseHistoryScreen({ navigation }) {
  const [historial, setHistorial] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    totalTomas: 0,
    tomasHoy: 0,
    tomasEstaSemana: 0,
    ultimaToma: null,
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [historialData, estadisticasData] = await Promise.all([
        obtenerHistorialTomas(),
        obtenerEstadisticasTomas(),
      ]);
      
      // Ordenar por fecha más reciente primero
      const historialOrdenado = historialData.sort((a, b) => 
        new Date(b.fecha) - new Date(a.fecha)
      );
      
      setHistorial(historialOrdenado);
      setEstadisticas(estadisticasData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  };

  const eliminarTomaHistorial = (toma) => {
    console.log("=== BOTÓN ELIMINAR TOMA HISTORIAL PRESIONADO ===");
    console.log("Toma:", toma);
    
    // Usar confirm con mensaje más moderno
    const confirmar = window.confirm(`🗑️ Eliminar Toma del Historial\n\n¿Estás seguro de que deseas eliminar esta toma de ${toma.medicamentoNombre}?\n\nFecha: ${formatearFecha(toma.fecha)}\nDosis: ${toma.dosis}\n\nPresiona OK para eliminar o Cancelar para mantener.`);
    
    if (confirmar) {
      console.log("Usuario confirmó eliminación de toma");
      handleEliminarToma(toma);
    } else {
      console.log("Usuario canceló eliminación de toma");
    }
  };

  const handleEliminarToma = async (toma) => {
    try {
      console.log("Iniciando eliminación de toma...");
      const exito = await eliminarToma(toma.id);
      console.log("Resultado eliminación:", exito);
      
      if (exito) {
        await cargarDatos();
        alert("✅ ¡Toma eliminada exitosamente!\n\nLa toma ha sido removida del historial.");
      } else {
        alert("❌ Error al eliminar toma\n\nNo se pudo eliminar la toma del historial.");
      }
    } catch (error) {
      console.error("Error al eliminar toma:", error);
      alert("❌ Error al eliminar toma\n\nHubo un problema al eliminar la toma. Inténtalo de nuevo.");
    }
  };

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);

    if (fecha.toDateString() === hoy.toDateString()) {
      return `Hoy ${fecha.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (fecha.toDateString() === ayer.toDateString()) {
      return `Ayer ${fecha.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return fecha.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={styles.medicineInfo}>
        <Text style={styles.medicineName}>{item.medicamentoNombre}</Text>
        <Text style={styles.doseInfo}>Dosis: {item.dosis}</Text>
        <Text style={styles.dateInfo}>{formatearFecha(item.fecha)}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          console.log("=== BOTÓN BASURA HISTORIAL TOUCHABLEOPACITY PRESIONADO ===");
          console.log("Item:", item);
          eliminarTomaHistorial(item);
        }}
      >
        <Text style={styles.deleteText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStatsCard = (title, value, color) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsTitle}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de Tomas</Text>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        {renderStatsCard("Total Tomas", estadisticas.totalTomas, "#4CAF50")}
        {renderStatsCard("Tomas Hoy", estadisticas.tomasHoy, "#FF9800")}
        {renderStatsCard("Esta Semana", estadisticas.tomasEstaSemana, "#2196F3")}
      </View>

      {/* Lista de tomas */}
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Registro de Tomas</Text>
        {historial.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No hay tomas registradas aún.
            </Text>
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
      </View>

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
    marginBottom: 20,
    color: "#333",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statsCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  statsTitle: {
    fontSize: 12,
    textAlign: "center",
    color: "#666",
    marginTop: 5,
  },
  historyContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
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
  doseInfo: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
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
