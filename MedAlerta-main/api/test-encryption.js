// Script de prueba para verificar encriptación
const bcrypt = require("bcryptjs");

async function testEncryption() {
  console.log("🔐 Probando encriptación de contraseñas...\n");

  const testPassword = "MiContraseña123";

  // Encriptar contraseña
  console.log("Password original:", testPassword);

  const hashedPassword = await bcrypt.hash(testPassword, 12);
  console.log("Password encriptada:", hashedPassword);
  console.log("Longitud:", hashedPassword.length);
  console.log(
    "¿Es hash de bcrypt?:",
    hashedPassword.startsWith("$2") && hashedPassword.length === 60
  );

  // Verificar contraseña
  const isValid = await bcrypt.compare(testPassword, hashedPassword);
  console.log("¿Contraseña válida?:", isValid);

  // Probar contraseña incorrecta
  const isInvalid = await bcrypt.compare(
    "ContraseñaIncorrecta",
    hashedPassword
  );
  console.log("¿Contraseña incorrecta detectada?:", !isInvalid);

  console.log("\n✅ Prueba de encriptación completada exitosamente!");
}

testEncryption().catch(console.error);
