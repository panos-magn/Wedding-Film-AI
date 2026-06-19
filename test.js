import http from 'http';

const postData = JSON.stringify({
  config: { prompt: "foo" },
  project: {},
  userInputs: {},
  userId: "test123"
});

const req = http.request(
  {
    hostname: '0.0.0.0',
    port: 3000,
    path: '/api/generate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  },
  (response) => {
    let data = '';
    response.on('data', (chunk) => { data += chunk; });
    response.on('end', () => {
      console.log(response.statusCode);
      console.log(data);
    });
  }
);

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
