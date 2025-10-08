// Prueba del endpoint de registro usando fetch
async function testRegistrationEndpoint() {
  try {
    console.log("🧪 Probando endpoint de registro...");
    
    const testData = {
      NomPaci: "María González Test",
      FeNaci: "1995-05-15",
      DireCasa: "Calle 123 #45-67",
      NumCel: 3001234567,
      Email: "maria.test@ejemplo.com",
      Contraseña: "TestPassword123"
    };
    
    console.log("📝 Enviando datos:", testData);
    
    const response = await fetch("http://localhost:3000/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log("✅ Registro exitoso!");
      console.log("📊 Respuesta del servidor:", data);
    } else {
      console.log("❌ Error en el registro:");
      console.log("📊 Respuesta del servidor:", data);
    }
    
  } catch (error) {
    console.error("❌ Error de conexión:", error.message);
  }
}

// Función para probar login también
async function testLoginEndpoint() {
  try {
    console.log("\n🔑 Probando endpoint de login...");
    
    const loginData = {
      Email: "maria.test@ejemplo.com",
      Contraseña: "TestPassword123"
    };
    
    console.log("📝 Enviando credenciales:", { Email: loginData.Email, Contraseña: "***" });
    
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log("✅ Login exitoso!");
      console.log("📊 Respuesta del servidor:", data);
    } else {
      console.log("❌ Error en el login:");
      console.log("📊 Respuesta del servidor:", data);
    }
    
  } catch (error) {
    console.error("❌ Error de conexión:", error.message);
  }
}

// Función principal
async function runTests() {
  console.log("🚀 Iniciando pruebas de endpoints...\n");
  
  // Esperar un poco para asegurar que el servidor esté listo
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testRegistrationEndpoint();
  await testLoginEndpoint();
  
  console.log("\n🔚 Pruebas completadas");
}

runTests();