const https = require('https');

const USER_ID  = 'shelle.sharma@gmail.com';
const API_KEY  = 'c7a2db90-0a38-592d-a4fc-308fadf2d842';
const API_BASE = 'json.astrologyapi.com';
const AUTH     = 'Basic ' + Buffer.from(USER_ID + ':' + API_KEY).toString('base64');
const PORT     = process.env.PORT || 3000;

require('http').createServer((req, res) => {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // Health check
  if (req.method === 'GET') {
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({status:'running', message:'Jyotish proxy is live'}));
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405); res.end('Method not allowed'); return;
  }

  const endpoint = req.url.replace(/^\//, '').split('?')[0];
  const allowed  = ['planets', 'ascendant_detail', 'vimshottari_dasha',
                    'current_vdasha', 'vedic_horoscope', 'horoscope_chart_url'];

  if (!allowed.includes(endpoint)) {
    res.writeHead(400, {'Content-Type':'application/json'});
    res.end(JSON.stringify({ error: 'Invalid endpoint. Allowed: ' + allowed.join(', ') }));
    return;
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {

    console.log(`Calling /${endpoint} with body:`, body.slice(0,100));

    const options = {
      hostname: API_BASE,
      path:     '/v1/' + endpoint,
      method:   'POST',
      headers:  {
        'Authorization': AUTH,
        'Content-Type':  'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const apiReq = https.request(options, apiRes => {
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        console.log(`Response ${apiRes.statusCode} from /${endpoint}:`, data.slice(0,200));
        res.writeHead(apiRes.statusCode, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(data);
      });
    });

    apiReq.on('error', err => {
      console.error('API request error:', err.message);
      res.writeHead(500, {'Content-Type':'application/json'});
      res.end(JSON.stringify({ error: err.message }));
    });

    apiReq.write(body);
    apiReq.end();
  });

}).listen(PORT, () => console.log('Jyotish proxy running on port', PORT));
