const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9250;
const TEST_URL = 'http://localhost:8765/test_modal.html';

function startChrome() {
  return new Promise((resolve, reject) => {
    const chrome = spawn(CHROME, [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
      '--remote-debugging-port=' + PORT,
      '--user-data-dir=' + path.join(__dirname, '.chrome-test-modal'),
      'about:blank'
    ]);
    chrome.on('error', reject);
    setTimeout(() => resolve(chrome), 2000);
  });
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const chrome = await startChrome();
  const pages = await httpGet('http://localhost:' + PORT + '/json/list');
  const page = pages.find(p => p.type === 'page');
  if (!page) { console.log('No page found'); chrome.kill(); return; }
  
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let msgId = 0;
  const pending = {};
  
  ws.addEventListener('message', event => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending[msg.id]) {
      pending[msg.id](msg);
      delete pending[msg.id];
    }
  });
  
  const send = (method, params = {}) => {
    return new Promise(resolve => {
      const id = ++msgId;
      pending[id] = resolve;
      ws.send(JSON.stringify({ id, method, params }));
    });
  };
  
  await new Promise(resolve => ws.addEventListener('open', resolve));
  await send('Page.enable');
  await send('Page.navigate', { url: TEST_URL });
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  var result = await send('Runtime.evaluate', {
    expression: 'document.getElementById("output").innerHTML',
    returnByValue: true
  });
  
  console.log(result.result.result.value.replace(/<br>/g, '\n'));
  
  ws.close();
  chrome.kill();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
