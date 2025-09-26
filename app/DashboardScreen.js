import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DashboardScreen({ navigation }) {
  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }]
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido a MedAlerta 🎉</Text>
      <TouchableOpacity style={styles.btn} onPress={handleLogout}>
        <Text style={styles.btnText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#f7f9fc' },
  title: { fontSize:22, fontWeight:'bold', marginBottom:20, color:'#333' },
  btn: { backgroundColor:'#FF3B30', paddingVertical:12, paddingHorizontal:20, borderRadius:8 },
  btnText: { color:'#fff', fontWeight:'700' }
});
