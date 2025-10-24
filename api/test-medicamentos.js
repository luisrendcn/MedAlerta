const axios = require('axios');

async function testMedicamentos() {
  try {
    console.log("Probando GET medicamentos...");
    const response = await axios.get("http://localhost:3000/api/medicamentos/5");
    console.log("✅ Respuesta:", response.data);

    console.log("Probando POST medicamento...");
    const postResponse = await axios.post("http://localhost:3000/api/medicamentos", {
      idPaciente: 5,
      nombre: "Paracetamol",
      dosis: "500mg",
      horario: "08:00"
    });
    console.log("✅ Creado:", postResponse.data);

  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.response) {
      console.error("Respuesta:", error.response.data);
    }
  }
}

testMedicamentos();