const https = require('https');

const API_KEY  = 'c7a2db90-0a38-592d-a4fc-308fadf2d842';
const PORT     = process.env.PORT || 3000;

// Test function to check what endpoints work
function callVedicAPI(endpoint, body, callback) {
  const data = JSON.stringify(body);
  const options = {
    hostname: 'api.vedicastroapi.com',
    path:     endpoint,
    method:   'POST',
    headers:  {
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };
  const req = require('https').request(options, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => callback(null, res.statusCode, d));
  });
  req.on('error', e => callback(e));
  req.write(data);
  req.end();
}

require('http').createServer((req, res) => {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  
  if (req.method === 'GET') {
    // Test endpoint to verify API key works
    const testBody = {
      dob: '30/05/1994', tob: '15:18',
      lat: 31.9579, lon: 77.1095, tz: 5.5,
      lang: 'en', house_type: 'whole-sign',
      zodiac_type: 'sidereal', api_key: API_KEY
    };
    callVedicAPI('/v3-json/horoscope/planet-details', testBody, (err, status, data) => {
      res.writeHead(200, {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});
      res.end(JSON.stringify({
        status: 'running',
        test_status: status,
        test_response: data ? data.slice(0,200) : null,
        error: err ? err.message : null
      }));
    });
    return;
  }

  if (req.method !== 'POST') { res.writeHead(405); res.end(); return; }

  const path = req.url.split('?')[0];

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    let parsed = {};
    try { parsed = JSON.parse(body); } catch(e) {}

    const newBody = JSON.stringify({
      dob:         parsed.dob        || '',
      tob:         parsed.tob        || '',
      lat:         parsed.lat        || 0,
      lon:         parsed.lon        || 0,
      tz:          parsed.tz         || 5.5,
      lang:        'en',
      house_type:  'whole-sign',
      zodiac_type: 'sidereal',
      api_key:     API_KEY
    });

    console.log(`POST ${path}`);
    console.log('Sending to VedicAstroAPI:', newBody);

    const options = {
      hostname: 'api.vedicastroapi.com',
      path:     '/v3-json' + path,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(newBody)
      }
    };

    const apiReq = require('https').request(options, apiRes => {
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
      console.error('Error:', err.message);
      res.writeHead(500, {'Content-Type':'application/json'});
      res.end(JSON.stringify({error: err.message}));
    });

    apiReq.write(newBody);
    apiReq.end();
  });

}).listen(PORT, () => console.log('Jyotish proxy running on port', PORT));
