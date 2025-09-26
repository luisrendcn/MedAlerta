import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import {
  Alert, StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (!stored) {
        Alert.alert('Error', 'No hay usuarios registrados. Regístrate primero.');
        return;
      }

      const user = JSON.parse(stored);
      if (user.email === email && user.password === password) {
        navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
      } else {
        Alert.alert('Error', 'Correo o contraseña incorrectos.');
      }
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Ocurrió un error al iniciar sesión.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>MedAlerta</Text>
      <Text style={styles.subtitle}>Iniciar Sesión</Text>

      {/* Campos */}
      <TextInput
        placeholder="usuario@correo.com"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Contraseña"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* Botón Entrar */}
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Entrar</Text>
      </TouchableOpacity>

      {/* Fila de botones secundarios */}
      <View style={styles.row}>
        {/* Botón Registrarse */}
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.secondaryButtonText}>Registrarse</Text>
        </TouchableOpacity>

        {/* Botón Olvidó contraseña */}
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>¿Olvidó su contraseña?</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        © 2025 MedAlerta. proyecto de Ingenieria de Software.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20, 
    backgroundColor: '#f7f9fc' 
  },
  brand: { 
    fontSize: 28, 
    fontWeight: '700', 
    textAlign: 'center', 
    marginBottom: 24, 
    color: '#1E7CFF' 
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  input: { 
    width: '100%', 
    height: 48, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    marginBottom: 12, 
    backgroundColor: '#fff' 
  },

  // 🔵 Botón principal
  loginButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // 🔵 Botones secundarios en fila
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#E6F0FF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  secondaryButtonText: {
    color: '#007BFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Footer
  footer: {
    marginTop: 30,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

