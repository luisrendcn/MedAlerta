const axios = require('axios');

async function run() {
  try {
    const testData = {
      NomPaci: 'carlitos maya',
      FeNaci: '1995-05-05',
      DireCasa: 'Calle Falsa 123',
      NumCel: 3009876543,
      Email: 'carlos@gmail.com',
      Contraseña: 'CarlosPass123'
    };

    console.log('Enviando POST a http://localhost:3000/api/register');
    const res = await axios.post('http://localhost:3000/api/register', testData, { timeout: 20000 });
    console.log('Respuesta status:', res.status);
    console.log('Respuesta data:', res.data);
  } catch (err) {
    if (err.response) {
      console.error('Error response status:', err.response.status);
      console.error('Error response data:', err.response.data);
    } else {
      console.error('Error al conectar con API:', err.message);
    }
  }
}

run();
