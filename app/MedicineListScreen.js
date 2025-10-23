import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
      }
    } catch (error) {
      console.error("Error al cargar medicamentos:", error);
    }
  };

  const deleteMedicine = async (id) => {
    console.log("=== BOTÓN ELIMINAR PRESIONADO ===");
    console.log("ID del medicamento:", id);
    
    // Buscar el medicamento para mostrar su nombre
    const medicamento = medicines.find(item => item.id === id);
    const nombreMedicamento = medicamento ? medicamento.nombre : "este medicamento";
    
    // Usar confirm con mensaje más moderno
    const confirmar = window.confirm(`🗑️ Eliminar Medicamento\n\n¿Estás seguro de que deseas eliminar ${nombreMedicamento}?\n\nEsta acción también cancelará las notificaciones programadas.\n\nPresiona OK para eliminar o Cancelar para mantener.`);
    
    if (confirmar) {
      console.log("Usuario confirmó eliminación");
      try {
        // Cancelar la notificación si existe
        if (medicamento && medicamento.notificationId) {
          console.log("Cancelando notificación:", medicamento.notificationId);
          await cancelarRecordatorio(medicamento.notificationId);
        }
        
        const updatedList = medicines.filter((item) => item.id !== id);
        setMedicines(updatedList);
        await AsyncStorage.setItem("@medicamentos", JSON.stringify(updatedList));
        
        alert("✅ ¡Medicamento eliminado exitosamente!\n\nEl medicamento y sus notificaciones han sido removidos.");
        console.log("Medicamento eliminado exitosamente");
      } catch (error) {
        console.error("Error eliminando medicamento:", error);
        alert("❌ Error al eliminar medicamento\n\nHubo un problema al eliminar el medicamento. Inténtalo de nuevo.");
      }
    } else {
      console.log("Usuario canceló eliminación");
    }
  };

  const editMedicine = (medicine) => {
    navigation.navigate("MedicineForm", { medicamento: medicine });
  };

  const registrarTomaMedicamento = (medicine) => {
    console.log("=== BOTÓN PASTILLA PRESIONADO ===");
    console.log("Medicamento:", medicine);
    
    // Usar confirm con mensaje más moderno
    const confirmar = window.confirm(`💊 Registrar Toma\n\n¿Has tomado ${medicine.nombre}?\nDosis: ${medicine.dosis}\n\nPresiona OK para confirmar o Cancelar para omitir.`);
    
    if (confirmar) {
      console.log("Usuario confirmó la toma");
      handleConfirmToma(medicine);
    } else {
      console.log("Usuario canceló");
    }
  };

  const handleConfirmToma = async (medicine) => {
    try {
      console.log("Iniciando registro de toma...");
      const toma = await registrarToma(medicine.id, medicine.nombre, medicine.dosis);
      console.log("Toma registrada:", toma);
      
      if (toma) {
        alert("✅ ¡Toma registrada exitosamente!\n\nTu medicamento ha sido registrado en el historial.");
        loadMedicines(); // Recargar la lista
      } else {
        alert("❌ Error al registrar toma\n\nNo se pudo guardar la información. Inténtalo de nuevo.");
      }
    } catch (error) {
      console.error("Error al registrar toma:", error);
      alert(`❌ Error al registrar toma\n\nDetalles: ${error.message}\n\nInténtalo de nuevo más tarde.`);
    }
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
          onPress={() => {
            console.log("=== TOUCHABLEOPACITY PRESIONADO ===");
            console.log("Item:", item);
            registrarTomaMedicamento(item);
          }}
        >
          <Text style={styles.takeText}>💊</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => editMedicine(item)}
        >
          <Text style={styles.editText}>✏️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            console.log("=== BOTÓN ELIMINAR TOUCHABLEOPACITY PRESIONADO ===");
            console.log("Item ID:", item.id);
            deleteMedicine(item.id);
          }}
        >
          <Text style={styles.deleteText}>🗑️</Text>
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
      />

      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("MedicineForm")}
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
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15, textAlign: "center", marginTop: 30 },
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
  takeButton: { backgroundColor: "#FF9800", padding: 12, borderRadius: 10, width: 50, height: 50, alignItems: "center", justifyContent: "center" },
  editButton: { backgroundColor: "#4CAF50", padding: 12, borderRadius: 10, width: 50, height: 50, alignItems: "center", justifyContent: "center" },
  deleteButton: { backgroundColor: "#ff4d4d", padding: 12, borderRadius: 10, width: 50, height: 50, alignItems: "center", justifyContent: "center" },
  takeText: { color: "#fff", fontSize: 20 },
  editText: { color: "#fff", fontSize: 20 },
  deleteText: { color: "#fff", fontSize: 20 },
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
});
