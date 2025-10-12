import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function MedicineFormScreen() {
  const [nombre, setNombre] = useState("");
  const [dosis, setDosis] = useState("");
  const [horario, setHorario] = useState("");
  const route = useRoute();
  const navigation = useNavigation();

  const medicamentoEdit = route.params?.medicamento;

  useEffect(() => {
    if (medicamentoEdit) {
      setNombre(medicamentoEdit.nombre);
      setDosis(medicamentoEdit.dosis);
      setHorario(medicamentoEdit.horario);
    }
  }, [medicamentoEdit]);

  const guardarMedicamento = async () => {
    if (!nombre || !dosis || !horario) {
      Alert.alert("Error", "Completa todos los campos obligatorios.");
      return;
    }

    try {
      const data = await AsyncStorage.getItem("@medicamentos");
      let lista = data ? JSON.parse(data) : [];

      if (medicamentoEdit) {
        // Si estamos editando un medicamento existente
        lista = lista.map((m) =>
          m.id === medicamentoEdit.id ? { ...m, nombre, dosis, horario } : m
        );
      } else {
        // Si estamos agregando uno nuevo
        lista.push({ id: Date.now(), nombre, dosis, horario });
      }

      await AsyncStorage.setItem("@medicamentos", JSON.stringify(lista));
      Alert.alert(
        "Éxito",
        medicamentoEdit
          ? "Medicamento actualizado correctamente."
          : "Medicamento guardado correctamente."
      );

      // Regresamos a la lista después de guardar o editar
      navigation.navigate("MedicineList");
    } catch (error) {
      console.error("Error al guardar medicamento:", error);
      Alert.alert("Error", "Hubo un problema al guardar el medicamento.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {"\n\n"}
        {medicamentoEdit ? "Editar Medicamento" : "Registrar Medicamento"}
      </Text>

      <TextInput
        placeholder="Nombre del medicamento"
        placeholderTextColor="#999"
        value={nombre}
        onChangeText={setNombre}
        style={styles.input}
      />
      <TextInput
        placeholder="Dosis (ej. 1 tableta)"
        placeholderTextColor="#999"
        value={dosis}
        onChangeText={setDosis}
        style={styles.input}
      />
      <TextInput
        placeholder="Horario (ej. 08:00 AM)"
        placeholderTextColor="#999"
        value={horario}
        onChangeText={setHorario}
        style={styles.input}
      />

      <TouchableOpacity style={styles.saveButton} onPress={guardarMedicamento}>
        <Text style={styles.btnText}>
          {medicamentoEdit ? "Guardar Cambios" : "Guardar"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.btnText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: "#E53935",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: { color: "#fff", fontWeight: "600" },
});
