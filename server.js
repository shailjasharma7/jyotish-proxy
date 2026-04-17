const https = require('https');

const API_KEY  = 'ak-062b7c8021dc3e51b36b4d79099a05c512bee26b';
const API_BASE = 'json.astrologyapi.com';
const PORT     = process.env.PORT || 3000;

require('http').createServer((req, res) => {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  if (req.method === 'GET') {
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({status:'running', api:'AstrologyAPI.com v1'})); return;
  }
  if (req.method !== 'POST') { res.writeHead(405); res.end(); return; }

  const path = req.url.split('?')[0];

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    let parsed = {};
    try { parsed = JSON.parse(body); } catch(e) {}

    const newBody = JSON.stringify({
      day:   parsed.day,
      month: parsed.month,
      year:  parsed.year,
      hour:  parsed.hour,
      min:   parsed.min,
      lat:   parsed.lat,
      lon:   parsed.lon,
      tzone: parsed.tzone || 5.5,
    });

    console.log(`POST /v1${path}`, newBody.slice(0,150));

    const options = {
      hostname: API_BASE,
      path:     '/v1' + path,
      method:   'POST',
      headers:  {
        'x-astrologyapi-key': API_KEY,
        'Content-Type':       'application/json',
        'Content-Length':     Buffer.byteLength(newBody)
      }
    };

    const apiReq = https.request(options, apiRes => {
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        console.log(`Response ${apiRes.statusCode}:`, data.slice(0, 500));
        res.writeHead(apiRes.statusCode, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(data);
      });
    });

    apiReq.on('error', err => {
      res.writeHead(500, {'Content-Type':'application/json'});
      res.end(JSON.stringify({error: err.message}));
    });

    apiReq.write(newBody);
    apiReq.end();
  });

}).listen(PORT, () => console.log('Jyotish proxy running on port', PORT));
