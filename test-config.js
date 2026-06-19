import http from 'http';
const req = http.request({
    hostname: '0.0.0.0', port: 3000, path: '/api/config-status', method: 'GET',
    headers: { 'Authorization': 'Bearer foo' }
  }, (res) => {
    let d = ''; res.on('data', c => d+=c); res.on('end', () => console.log(res.statusCode, d.substring(0,200)));
});
req.end();
