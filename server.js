const https = require('https');
const API_KEY = 'c7a2db90-0a38-592d-a4fc-308fadf2d842';
const PORT = process.env.PORT || 3000;

function callAPI(path, body, cb) {
  const data = JSON.stringify({...body, api_key: API_KEY});
  const req = https.request({
    hostname: 'api.vedicastroapi.com',
    path, method: 'POST',
    headers: {'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}
  }, res => {
    let d=''; res.on('data',c=>d+=c);
    res.on('end',()=>cb(res.statusCode,d));
  });
  req.on('error',e=>cb(500,JSON.stringify({error:e.message})));
  req.write(data); req.end();
}

require('http').createServer((req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS'){res.writeHead(200);res.end();return;}

  if(req.method==='GET'){
    // Test all possible endpoint paths
    const testBody = {dob:'30/05/1994',tob:'15:18',lat:'31.9579',lon:'77.1095',tz:5.5,lang:'en',house_type:'whole-sign',zodiac_type:'sidereal'};
    const paths = [
      '/v3-json/horoscope/planet-details',
      '/v3-json/horoscope/planet_details',
      '/v3-json/horoscope/planets',
      '/v3-json/horoscope/kundli',
    ];
    let results = {}, done = 0;
    paths.forEach(p => {
      callAPI(p, testBody, (status, data) => {
        results[p] = {status, data: data.slice(0,100)};
        done++;
        if(done===paths.length){
          res.writeHead(200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});
          res.end(JSON.stringify(results,null,2));
        }
      });
    });
    return;
  }

  let body='';
  req.on('data',c=>body+=c);
  req.on('end',()=>{
    let parsed={};
    try{parsed=JSON.parse(body);}catch(e){}
    const newBody={
      dob:String(parsed.dob||''),tob:String(parsed.tob||''),
      lat:String(parsed.lat||''),lon:String(parsed.lon||''),
      tz:parsed.tz||5.5,lang:'en',
      house_type:'whole-sign',zodiac_type:'sidereal'
    };
    const path='/v3-json'+req.url.split('?')[0];
    callAPI(path,newBody,(status,data)=>{
      res.writeHead(status,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});
      res.end(data);
    });
  });
}).listen(PORT,()=>console.log('running on',PORT));
