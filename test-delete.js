const fs = require('fs');
const https = require('https');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const anonKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)[1].trim();
const serviceKey = env.match(/SUPABASE_SERVICE_KEY=(.+)/)[1].trim();

function testDelete(label, key) {
  const u = new URL('/rest/v1/jobs?title=eq.TEST_DELETE_ME', url);
  const req = https.request({hostname: u.hostname, path: u.pathname + u.search, method: 'DELETE', headers: {'apikey': key, 'Authorization': 'Bearer ' + key}}, res => {
    console.log(label + ':', res.statusCode);
  });
  req.end();
}

testDelete('anon key', anonKey);
setTimeout(() => testDelete('service key', serviceKey), 500);
