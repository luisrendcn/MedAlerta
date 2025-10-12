import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar este medicamento?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedList = medicines.filter((item) => item.id !== id);
              setMedicines(updatedList);
              await AsyncStorage.setItem("@medicamentos", JSON.stringify(updatedList));
            } catch (error) {
              console.error("Error eliminando medicamento:", error);
            }
          },
        },
      ]
    );
  };

  const editMedicine = (medicine) => {
    navigation.navigate("MedicineForm", { medicamento: medicine });
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View>
        <Text style={styles.name}>{item.nombre}</Text>
        <Text style={styles.details}>Dosis: {item.dosis}</Text>
        <Text style={styles.details}>Hora: {item.horario}</Text>
      </View>

      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => editMedicine(item)}
        >
          <Text style={styles.editText}>✏️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteMedicine(item.id)}
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

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("MedicineForm")}
      >
        <Text style={styles.addButtonText}>Agregar Medicamento ➕</Text>
      </TouchableOpacity>
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
  name: { fontSize: 18, fontWeight: "600" },
  details: { fontSize: 14, color: "#555" },
  buttonsRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  editButton: { backgroundColor: "#4CAF50", padding: 8, borderRadius: 10 },
  deleteButton: { backgroundColor: "#ff4d4d", padding: 8, borderRadius: 10 },
  editText: { color: "#fff", fontSize: 18 },
  deleteText: { color: "#fff", fontSize: 18 },
  addButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
