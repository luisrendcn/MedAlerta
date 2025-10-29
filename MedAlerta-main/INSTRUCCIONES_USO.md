# MedAlerta - Aplicación de Seguimiento de Medicamentos

## 📱 Descripción
MedAlerta es una aplicación móvil desarrollada con React Native y Expo que te ayuda a llevar un control completo de tus medicamentos, incluyendo recordatorios automáticos y un historial detallado de tomas.

## ✨ Características Principales

### 🔔 Sistema de Notificaciones
- **Recordatorios automáticos**: Recibe notificaciones en los horarios programados para cada medicamento
- **Permisos inteligentes**: La app solicita automáticamente los permisos necesarios
- **Notificaciones persistentes**: Los recordatorios se repiten diariamente hasta que edites o elimines el medicamento

### 📊 Historial de Tomas
- **Registro detallado**: Cada vez que tomas un medicamento, se registra automáticamente con fecha y hora
- **Estadísticas visuales**: Ve cuántas tomas has registrado hoy, esta semana y en total
- **Gestión completa**: Puedes eliminar tomas registradas por error

### 💊 Gestión de Medicamentos
- **Agregar medicamentos**: Registra nombre, dosis y horario de cada medicamento
- **Editar información**: Modifica cualquier medicamento existente
- **Eliminar medicamentos**: Remueve medicamentos que ya no necesitas

## 🚀 Cómo Usar la Aplicación

### 1. Agregar un Medicamento
1. Ve a la pantalla "Lista de Medicamentos"
2. Toca "Agregar Medicamento ➕"
3. Completa los campos:
   - **Nombre del medicamento**: Ej. "Paracetamol"
   - **Dosis**: Ej. "1 tableta"
   - **Horario**: Ej. "08:00 AM" o "20:30"
4. Toca "Guardar"

### 2. Registrar una Toma
1. En la lista de medicamentos, verás cada medicamento con botones de acción
2. Toca el botón naranja 💊 para registrar que tomaste el medicamento
3. Confirma en el diálogo que aparece
4. La toma se registrará automáticamente en tu historial

### 3. Ver el Historial
1. En la pantalla principal, toca "Ver Historial 📊"
2. Verás estadísticas en la parte superior:
   - Total de tomas registradas
   - Tomas de hoy
   - Tomas de esta semana
3. La lista muestra todas tus tomas ordenadas por fecha (más recientes primero)

### 4. Gestionar Medicamentos
- **Editar**: Toca ✏️ para modificar un medicamento
- **Eliminar**: Toca 🗑️ para eliminar un medicamento
- **Eliminar toma**: En el historial, toca 🗑️ junto a cualquier toma

## ⚙️ Configuración de Notificaciones

### Permisos Requeridos
La aplicación necesita permisos de notificación para funcionar correctamente:

1. **Primera vez**: La app solicitará permisos automáticamente
2. **Si denegaste**: Ve a Configuración > Aplicaciones > MedAlerta > Notificaciones y habilítalas
3. **Dispositivo físico**: Las notificaciones solo funcionan en dispositivos reales, no en simuladores

### Formatos de Horario Soportados
- `08:00 AM` (formato 12 horas con AM/PM)
- `20:30` (formato 24 horas)
- `8:00 AM` (sin cero inicial)
- `08:00` (formato 24 horas sin minutos)

## 🔧 Funcionalidades Técnicas

### Almacenamiento
- Los medicamentos se guardan localmente en el dispositivo
- El historial de tomas se almacena de forma persistente
- Los datos se mantienen entre sesiones de la aplicación

### Notificaciones
- Se programan automáticamente al agregar/editar medicamentos
- Se cancelan automáticamente al eliminar medicamentos
- Se actualizan cuando modificas el horario de un medicamento

### Historial
- Cada toma incluye: ID del medicamento, nombre, dosis, fecha y hora
- Las estadísticas se calculan en tiempo real
- Soporte para eliminar tomas individuales

## 🐛 Solución de Problemas

### Las notificaciones no aparecen
1. Verifica que tengas permisos de notificación habilitados
2. Asegúrate de estar usando un dispositivo físico (no simulador)
3. Revisa que el formato de horario sea correcto

### No puedo registrar tomas
1. Verifica que el medicamento esté guardado correctamente
2. Reinicia la aplicación si persiste el problema
3. Revisa que tengas espacio de almacenamiento disponible

### El historial no se actualiza
1. Toca "Ver Historial 📊" para refrescar la pantalla
2. Desliza hacia abajo en la lista para actualizar manualmente
3. Reinicia la aplicación si es necesario

## 📱 Compatibilidad
- **iOS**: Compatible con iOS 11.0+
- **Android**: Compatible con Android 6.0+ (API level 23+)
- **Expo**: Desarrollado con Expo SDK 54

## 🔄 Actualizaciones Futuras
- Exportar historial a PDF
- Recordatorios personalizables
- Estadísticas avanzadas
- Sincronización en la nube
- Múltiples usuarios por dispositivo

---

**Desarrollado con ❤️ para ayudarte a mantener un mejor control de tu salud**
