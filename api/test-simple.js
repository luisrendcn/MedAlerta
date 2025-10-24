const http = require("http");

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/",
  method: "GET",
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on("data", (chunk) => {
    console.log(`Body: ${chunk}`);
  });
});

req.on("error", (e) => {
  console.error(`Error: ${e.message}`);
});

req.end();
