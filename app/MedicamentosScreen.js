import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  cancelScheduledNotificationAsync,
  scheduleNotificationAsync,
} from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_ENDPOINTS, buildApiUrl } from "../config/api";

export default function MedicamentosScreen({ navigation }) {
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [nombre, setNombre] = useState("");
  const [dosis, setDosis] = useState("");
  const [horario, setHorario] = useState("");

  const [paciente, setPaciente] = useState(null);

  const loadPaciente = async () => {
    try {
      const pacienteData = await AsyncStorage.getItem("paciente");
      if (pacienteData) {
        setPaciente(JSON.parse(pacienteData));
      }
    } catch (error) {
      console.error("Error loading paciente:", error);
    }
  };

  const loadMedicamentos = useCallback(async () => {
    if (!paciente) return;

    setLoading(true);
    try {
      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.MEDICAMENTOS) + `/${paciente.idPaciente}`
      );
      const data = await response.json();

      if (response.ok) {
        setMedicamentos(data);
      } else {
        setMessage("Error al cargar medicamentos");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error loading medicamentos:", error);
      setMessage("Error de conexión");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }, [paciente]);

  useEffect(() => {
    loadPaciente();
  }, []);

  useEffect(() => {
    if (paciente) {
      loadMedicamentos();
    }
  }, [paciente, loadMedicamentos]);

  const handleSave = async () => {
    if (!nombre || !dosis || !horario) {
      setMessage("Todos los campos son obligatorios");
      setMessageType("error");
      return;
    }

    // Validar formato de horario HH:MM
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(horario)) {
      setMessage("Horario debe tener formato HH:MM (ej: 08:30)");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const url = isEditing
        ? buildApiUrl(API_ENDPOINTS.MEDICAMENTOS) + `/${editingId}`
        : buildApiUrl(API_ENDPOINTS.MEDICAMENTOS);

      const method = isEditing ? "PUT" : "POST";

      const body = isEditing
        ? { nombre, dosis, horario }
        : { idPaciente: paciente.idPaciente, nombre, dosis, horario };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(
          isEditing
            ? "Medicamento actualizado correctamente"
            : "Medicamento guardado correctamente"
        );
        setMessageType("success");
        resetForm();
        loadMedicamentos();

        // Schedule notification
        const data = response.data || (await response.json());
        const [hour, minute] = horario.split(":").map(Number);
        const identifier = `medicamento-${data.idMedica || editingId}`;

        // Cancel previous if editing
        if (isEditing) {
          await cancelScheduledNotificationAsync(identifier);
          await cancelScheduledNotificationAsync(`${identifier}-followup`);
        }

        await scheduleNotificationAsync({
          identifier,
          content: {
            title: "¡Hora de tu Medicamento!",
            body: `Toma tu ${nombre} - Dosis: ${dosis}`,
            data: { idMedica: data.idMedica || editingId, nombre },
            categoryIdentifier: "medicamento",
            sound: "alarm.mp3",
          },
          trigger: {
            hour,
            minute,
            repeats: true,
          },
        }).catch((error) =>
          console.error("Error scheduling notification:", error)
        );

        // Schedule follow-up alert 5 minutes later
        const followupMinute = minute + 5;
        const followupHour = followupMinute >= 60 ? hour + 1 : hour;
        const adjustedMinute = followupMinute >= 60 ? followupMinute - 60 : followupMinute;

        await scheduleNotificationAsync({
          identifier: `${identifier}-followup`,
          content: {
            title: "Recordatorio: Medicamento Pendiente",
            body: `No has confirmado la toma de ${nombre}. ¿La tomaste?`,
            data: { idMedica: data.idMedica || editingId, nombre, isFollowup: true },
            categoryIdentifier: "medicamento",
            sound: "alarm.mp3",
          },
          trigger: {
            hour: followupHour,
            minute: adjustedMinute,
            repeats: true,
          },
        }).catch((error) =>
          console.error("Error scheduling followup notification:", error)
        );
      } else {
        setMessage(data.error || "Error al guardar medicamento");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error saving medicamento:", error);
      setMessage("Error de conexión");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (medicamento) => {
    setIsEditing(true);
    setEditingId(medicamento.idMedica);
    setNombre(medicamento.NomMedica);
    setDosis(medicamento.Dosis);
    setHorario(medicamento.horario);
  };

  const handleDelete = async (id) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que quieres eliminar este medicamento?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const response = await fetch(
                buildApiUrl(API_ENDPOINTS.MEDICAMENTOS) + `/${id}`,
                {
                  method: "DELETE",
                }
              );

              if (response.ok) {
                setMessage("Medicamento eliminado correctamente");
                setMessageType("success");
                loadMedicamentos();

                // Cancel notification
                cancelScheduledNotificationAsync(`medicamento-${id}`).catch(
                  (error) =>
                    console.error("Error canceling notification:", error)
                );
                cancelScheduledNotificationAsync(`medicamento-${id}-followup`).catch(
                  (error) =>
                    console.error("Error canceling followup notification:", error)
                );
              } else {
                setMessage("Error al eliminar medicamento");
                setMessageType("error");
              }
            } catch (error) {
              console.error("Error deleting medicamento:", error);
              setMessage("Error de conexión");
              setMessageType("error");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setNombre("");
    setDosis("");
    setHorario("");
  };

  const renderMedicamento = ({ item }) => (
    <View style={styles.medicamentoItem}>
      <View style={styles.medicamentoInfo}>
        <Text style={styles.medicamentoNombre}>{item.NomMedica}</Text>
        <Text style={styles.medicamentoDetalle}>
          Dosis: {item.Dosis} - Horario: {item.horario}
        </Text>
      </View>
      <View style={styles.medicamentoActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEdit(item)}
        >
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item.idMedica)}
        >
          <Text style={styles.deleteButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Medicamentos</Text>

      {message ? (
        <Text
          style={[
            styles.message,
            messageType === "success" ? styles.success : styles.error,
          ]}
        >
          {message}
        </Text>
      ) : null}

      {/* Formulario */}
      <View style={styles.form}>
        <TextInput
          placeholder="Nombre del medicamento"
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
        />
        <TextInput
          placeholder="Dosis (ej: 500mg)"
          style={styles.input}
          value={dosis}
          onChangeText={setDosis}
        />
        <TextInput
          placeholder="Horario (HH:MM)"
          style={styles.input}
          value={horario}
          onChangeText={setHorario}
          keyboardType="numeric"
        />
        <View style={styles.formActions}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading
                ? "Guardando..."
                : isEditing
                ? "Actualizar"
                : "Agregar Medicamento"}
            </Text>
          </TouchableOpacity>
          {isEditing && (
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={resetForm}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Lista de medicamentos */}
      <Text style={styles.subtitle}>Mis Medicamentos</Text>
      {medicamentos.length === 0 ? (
        <Text style={styles.emptyText}>No tienes medicamentos registrados</Text>
      ) : (
        <FlatList
          data={medicamentos}
          renderItem={renderMedicamento}
          keyExtractor={(item) => item.idMedica.toString()}
          style={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f7f9fc",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#1E7CFF",
  },
  message: {
    textAlign: "center",
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
  },
  success: {
    backgroundColor: "#d4edda",
    color: "#155724",
  },
  error: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
  },
  form: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: "#28a745",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
  },
  list: {
    flex: 1,
  },
  medicamentoItem: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medicamentoInfo: {
    flex: 1,
  },
  medicamentoNombre: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  medicamentoDetalle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  medicamentoActions: {
    flexDirection: "row",
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: "#007bff",
  },
  editButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});
