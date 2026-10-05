const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const express = require('express');
const { createServer } = require('node:http');
const { io } = require('socket.io-client');
const { buildPages, normalizeServerUrl } = require('../scripts/build-pages');
const { createGameServer } = require('../server');

test('Pages artifact serves every script and stylesheet under a repository subpath', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'sabana-pages-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  await buildPages({ serverUrl: 'https://sabana.example/', outDir: dir });
  const app = express();
  app.use('/my-repository', express.static(dir));
  const server = createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/my-repository/`;
  const response = await fetch(`${base}?role=host`);
  assert.equal(response.status, 200);
  const html = await response.text();
  const assets = [...html.matchAll(/(?:src|href)="([^\"]+\.(?:js|css))"/g)].map(match => match[1]);
  assert.equal(assets.length, 5);
  for (const asset of assets) {
    const url = new URL(asset, base);
    assert.ok(url.pathname.startsWith('/my-repository/'));
    const assetResponse = await fetch(url);
    assert.equal(assetResponse.status, 200);
    assert.ok((await assetResponse.text()).length > 20);
  }
  const context = { window: {} };
  vm.runInNewContext(await fs.readFile(path.join(dir, 'config.js'), 'utf8'), context);
  assert.equal(context.window.SABANA_CONFIG.serverUrl, 'https://sabana.example');
  await fs.access(path.join(dir, '.nojekyll'));
  for (const invalid of ['', 'http://example.com', 'https://example.com/path', 'https://user:password@example.com', 'https://example.com/?x=1']) {
    assert.throws(() => normalizeServerUrl(invalid));
  }
});

test('Pages frontend selects host, connects externally, and shares an invitation in its repository', async () => {
  const source = await fs.readFile(path.join(__dirname, '../public/app.js'), 'utf8');
  for (const pathname of ['/my-repository/', '/', '/my-repository/index.html']) {
    const handlers = {};
    const socket = { on() {}, connected: true };
    const app = { innerHTML: '', addEventListener: (name, callback) => { handlers[name] = callback; } };
    let endpoint, invitation;
    const context = {
      window: { SABANA_CONFIG: { serverUrl: 'https://backend.example' } },
      location: new URL(`https://owner.github.io${pathname}?role=host`),
      io: url => { endpoint = url; return socket; },
      document: { querySelector: selector => selector === '#app' ? app : {}, addEventListener() {} },
      sessionStorage: { getItem: () => null },
      URL, URLSearchParams, setInterval() {}, setTimeout() {}, clearTimeout() {},
      navigator: { clipboard: { writeText: async text => { invitation = text; } } }
    };
    vm.runInNewContext(source, context);
    assert.equal(endpoint, 'https://backend.example');
    assert.ok(app.innerHTML.includes('Guía la expedición'));
    assert.ok(app.innerHTML.includes('href="./?role=player"'));
    vm.runInNewContext('state = { code: "SABANA-123456", players: [] };', context);
    const button = { id: 'copy', dataset: {}, isConnected: true, classList: { add() {}, remove() {} }, setAttribute() {}, removeAttribute() {} };
    handlers.click({ target: { closest: () => button } });
    await new Promise(resolve => setImmediate(resolve));
    const expected = new URL('./?role=player&code=SABANA-123456', context.location);
    assert.equal(invitation, expected.href);
  }
});

test('external Pages origin gets CORS headers and can create a room over polling', async t => {
  const origin = 'https://owner.github.io';
  const game = createGameServer({ allowedOrigins: `${origin}, https://sabana.example` });
  await new Promise(resolve => game.http.listen(0, '127.0.0.1', resolve));
  t.after(() => game.close());
  const url = `http://127.0.0.1:${game.http.address().port}`;
  assert.deepEqual(await (await fetch(`${url}/health`)).json(), { status: 'ok' });
  const allowed = await fetch(`${url}/socket.io/?EIO=4&transport=polling`, { headers: { Origin: origin } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), origin);
  const denied = await fetch(`${url}/socket.io/?EIO=4&transport=polling`, { headers: { Origin: 'https://other.example' } });
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
  const socket = io(url, { transports: ['polling'], extraHeaders: { Origin: origin }, reconnection: false });
  t.after(() => socket.disconnect());
  await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
  const reply = await new Promise((resolve, reject) => socket.timeout(2000).emit('create_room', {}, (error, reply) => error ? reject(error) : resolve(reply)));
  assert.equal(reply.ok, true);
  assert.match(reply.session.code, /^SABANA-\d{6}$/);
});
