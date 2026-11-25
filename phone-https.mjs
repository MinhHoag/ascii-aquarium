import { createServer } from 'node:https';
import { readFileSync } from 'node:fs';

const [host, cert, key] = process.argv.slice(2);
if (!host || !cert || !key) {
  console.error('Usage: node phone-https.mjs LAN_IP CERT.pem KEY.pem');
  process.exit(1);
}

const routes = new Map([
  ['/', ['phone.html', 'text/html']],
  ['/phone.html', ['phone.html', 'text/html']],
  ['/phone.js', ['phone.js', 'text/javascript']],
  ['/reef.css', ['reef.css', 'text/css']]
]);
createServer({ cert: readFileSync(cert), key: readFileSync(key) }, (request,response) => {
  const asset = routes.get(request.url);
  if (request.method !== 'GET' || !asset) {
    response.writeHead(404).end();
    return;
  }
  const [file, type] = asset;
  response.writeHead(200, {'Content-Type': type + '; charset=utf-8'});
  response.end(readFileSync(new URL('wwwroot/' + file, import.meta.url)));
}).listen(5443, host, () => console.log('Open in Bluefy: https://' + host + ':5443/'));
