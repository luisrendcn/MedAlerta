import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { cancelarRecordatorio, registrarToma } from "./NotificationService";

export default function MedicineListScreen({ navigation }) {
  const [medicines, setMedicines] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadMedicines);
    return unsubscribe;
  }, [navigation]);

  const loadMedicines = async () => {
    try {
      const stored = await AsyncStorage.getItem("@medicamentos");
      if (stored) {
        setMedicines(JSON.parse(stored));
      } else {
        setMedicines([]);
      }
    } catch (error) {
      console.error("Error al cargar medicamentos:", error);
    }
  };

  const deleteMedicine = async (id) => {
    const medicamento = medicines.find((item) => item.id === id);
    const nombreMedicamento = medicamento ? medicamento.nombre : "este medicamento";

    Alert.alert(
      "🗑️ Eliminar Medicamento",
      `¿Deseas eliminar ${nombreMedicamento}? Esta acción también cancelará las notificaciones programadas.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              if (medicamento && medicamento.notificationId) {
                await cancelarRecordatorio(medicamento.notificationId);
              }

              const updatedList = medicines.filter((item) => item.id !== id);
              setMedicines(updatedList);
              await AsyncStorage.setItem("@medicamentos", JSON.stringify(updatedList));

              Alert.alert("✅ Eliminado", "Medicamento eliminado exitosamente.");
            } catch (error) {
              console.error("Error eliminando medicamento:", error);
              Alert.alert("❌ Error", "No se pudo eliminar el medicamento.");
            }
          },
        },
      ]
    );
  };

  const registrarTomaMedicamento = async (medicine) => {
    Alert.alert(
      "💊 Registrar Toma",
      `¿Has tomado ${medicine.nombre}?\nDosis: ${medicine.dosis}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              await registrarToma(medicine.id, medicine.nombre, medicine.dosis);
              Alert.alert("✅ Toma registrada", "Se guardó en el historial.");
            } catch (error) {
              console.error("Error al registrar toma:", error);
              Alert.alert("❌ Error", "No se pudo registrar la toma.");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.medicineInfo}>
        <Text style={styles.name}>{item.nombre}</Text>
        <Text style={styles.details}>Dosis: {item.dosis}</Text>
        <Text style={styles.details}>Hora: {item.horario}</Text>
      </View>

      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={styles.takeButton}
          onPress={() => registrarTomaMedicamento(item)}
        >
          <Text style={styles.icon}>💊</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate("MedicineForm", { medicamento: item })}
        >
          <Text style={styles.icon}>✏️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteMedicine(item.id)}
        >
          <Text style={styles.icon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de Medicamentos</Text>

      <FlatList
        data={medicines}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay medicamentos registrados.</Text>
        }
      />

      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("AddMedicine")}
        >
          <Text style={styles.addButtonText}>Agregar Medicamento ➕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate("DoseHistory")}
        >
          <Text style={styles.historyButtonText}>Ver Historial 📊</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    marginTop: 30,
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicineInfo: { flex: 1 },
  name: { fontSize: 18, fontWeight: "600" },
  details: { fontSize: 14, color: "#555" },
  buttonsRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  takeButton: {
    backgroundColor: "#FF9800",
    padding: 12,
    borderRadius: 10,
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 10,
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
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
  icon: { color: "#fff", fontSize: 20 },
  bottomButtons: { marginTop: 20, gap: 10 },
  addButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  historyButton: {
    backgroundColor: "#9C27B0",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  historyButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  emptyText: {
    textAlign: "center",
    color: "#777",
    fontSize: 16,
    marginTop: 40,
  },
});
