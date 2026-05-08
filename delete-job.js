const fs = require('fs');
const https = require('https');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_KEY=(.+)/)[1].trim();
const jobId = '0x5907600597d6f101a4879f3d09cfbb995158f7ec5a1d2a9b138c14427293726d';

function del(table, field) {
  return new Promise((resolve) => {
    const u = new URL('/rest/v1/' + table + '?' + field + '=eq.' + encodeURIComponent(jobId), url);
    const req = https.request({hostname: u.hostname, path: u.pathname + u.search, method: 'DELETE', headers: {'apikey': key, 'Authorization': 'Bearer ' + key}}, res => {
      console.log(table + ':', res.statusCode);
      resolve();
    });
    req.end();
  });
}

async function run() {
  await del('disputes', 'job_id');
  await del('messages', 'job_id');
  await del('applications', 'job_id');
  await del('jobs', 'id');
  console.log('Done!');
}
run();
