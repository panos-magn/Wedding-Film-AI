import http from 'http';
const req = http.request({
    hostname: '0.0.0.0', port: 3000, path: '/', method: 'GET',
  }, (res) => {
    console.log(res.headers);
    let d = ''; res.on('data', c => d+=c); res.on('end', () => console.log(res.statusCode));
});
req.end();
