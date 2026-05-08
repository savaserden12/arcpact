const https = require('https');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const key = env.match(/ANTHROPIC_API_KEY=(.+)/)[1].trim();
console.log('Using key:', key.slice(0, 20));
const data = JSON.stringify({model: 'claude-haiku-4-5-20251001', max_tokens: 10, messages: [{role: 'user', content: 'hi'}]});
const req = https.request({hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST', headers: {'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Length': Buffer.byteLength(data)}}, res => {let b = ''; res.on('data', d => b += d); res.on('end', () => console.log(res.statusCode, b.slice(0, 200)))});
req.write(data);
req.end();
