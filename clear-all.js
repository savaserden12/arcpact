const fs = require('fs');
const https = require('https');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_KEY=(.+)/)[1].trim();

function del(table) {
  return new Promise((resolve) => {
    const u = new URL('/rest/v1/' + table + '?id=neq.null', url);
    const req = https.request({hostname: u.hostname, path: u.pathname + u.search, method: 'DELETE', headers: {'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'}}, res => {
      console.log(table + ' Status:', res.statusCode);
      resolve();
    });
    req.end();
  });
}

async function run() {
  await del('disputes');
  await del('messages');
  await del('applications');
  await del('jobs');
  console.log('Done!');
}
run();
