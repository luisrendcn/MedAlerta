import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import {
  Alert, StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from 'react-native';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor llena todos los campos');
      return;
    }
    try {
      const user = { email, password };
      await AsyncStorage.setItem('user', JSON.stringify(user));
      Alert.alert('Éxito', 'Usuario registrado correctamente');
      navigation.navigate('Login'); // vuelve al login
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Ocurrió un error al registrarse');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Registro</Text>

      <TextInput
        placeholder="Correo electrónico"
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

      <TouchableOpacity style={styles.btnPrimary} onPress={handleRegister}>
        <Text style={styles.btnText}>Registrar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', padding:20, backgroundColor:'#f7f9fc' },
  brand: { fontSize:28, fontWeight:'700', textAlign:'center', marginBottom:24, color:'#1E7CFF' },
  input: { width:'100%', height:48, borderWidth:1, borderColor:'#ddd', borderRadius:8, paddingHorizontal:12, marginBottom:12, backgroundColor:'#fff' },
  btnPrimary: { backgroundColor:'#1E7CFF', paddingVertical:12, borderRadius:8, alignItems:'center', marginTop:6 },
  btnText: { color:'#fff', fontWeight:'700' }
});
