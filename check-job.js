const fs = require('fs');
const https = require('https');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_KEY=(.+)/)[1].trim();
const jobId = '0x5907600597d6f101a4879f3d09cfbb995158f7ec5a1d2a9b138c14427293726d';
const u = new URL('/rest/v1/jobs?id=eq.' + jobId, url);
const req = https.request({hostname: u.hostname, path: u.pathname + u.search, method: 'GET', headers: {'apikey': key, 'Authorization': 'Bearer ' + key}}, res => {
  let b = ''; res.on('data', d => b += d); res.on('end', () => console.log(res.statusCode, b.slice(0, 300)));
});
req.end();
