const https = require('https');
 
const API_KEY  = 'c7a2db90-0a38-592d-a4fc-308fadf2d842';
const PORT     = process.env.PORT || 3000;
 
require('http').createServer((req, res) => {
 
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  if (req.method === 'GET') {
    res.writeHead(200, {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});
    res.end(JSON.stringify({status:'running'})); return;
  }
  if (req.method !== 'POST') { res.writeHead(405); res.end(); return; }
 
  const path = req.url.split('?')[0];
 
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    let parsed = {};
    try { parsed = JSON.parse(body); } catch(e) {}
 
    // IMPORTANT: lat, lon, tz must be STRINGS as VedicAstroAPI expects
    const newBody = JSON.stringify({
      dob:         String(parsed.dob || ''),
      tob:         String(parsed.tob || ''),
      lat:         String(parsed.lat || ''),
      lon:         String(parsed.lon || ''),
      tz:          parsed.tz || 5.5,
      lang:        'en',
      house_type:  'whole-sign',
      zodiac_type: 'sidereal',
      api_key:     API_KEY
    });
 
    console.log(`POST /v3-json${path}`);
    console.log('Body:', newBody);
 
    const options = {
      hostname: 'api.vedicastroapi.com',
      path:     '/v3-json' + path,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(newBody)
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
 
