const axios = require("axios");

async function ping() {
  try {
    const res = await axios.get("http://localhost:3000/", { timeout: 5000 });
    console.log("Status:", res.status);
    console.log("Body:", res.data);
  } catch (err) {
    if (err.response) {
      console.error("Error response status:", err.response.status);
      console.error("Error response data:", err.response.data);
    } else {
      console.error("Error connecting to API:", err.message);
    }
  }
}

ping();
