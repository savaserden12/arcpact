const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_KEY=(.+)/)[1].trim();
const https = require('https');
const u = new URL('/rest/v1/jobs?id=neq.null', url);
const req = https.request({hostname: u.hostname, path: u.pathname + u.search, method: 'DELETE', headers: {'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'}}, res => {
  console.log('Status:', res.statusCode);
});
req.end();
