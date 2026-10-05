const fs = require('node:fs/promises');
const path = require('node:path');

function normalizeServerUrl(value) {
  if (!value) throw new Error('Configura SABANA_SERVER_URL con la URL HTTPS del servidor multijugador.');
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('SABANA_SERVER_URL debe ser un origen HTTPS sin ruta, credenciales ni parámetros, por ejemplo https://sabana.onrender.com.');
  }
  return url.origin;
}

async function buildPages({ serverUrl = process.env.SABANA_SERVER_URL, outDir = path.join(__dirname, '../dist') } = {}) {
  const origin = normalizeServerUrl(serverUrl);
  const root = path.join(__dirname, '..');
  await fs.mkdir(outDir, { recursive: true });
  for (const file of ['index.html', 'styles.css', 'motion.css', 'favicon.svg', 'app.js']) {
    await fs.copyFile(path.join(root, 'public', file), path.join(outDir, file));
  }
  await fs.writeFile(path.join(outDir, 'config.js'), `window.SABANA_CONFIG = ${JSON.stringify({ serverUrl: origin })};\n`);
  // Bundle the client: Pages cannot serve Socket.IO's dynamic server endpoint.
  await fs.mkdir(path.join(outDir, 'socket.io'), { recursive: true });
  await fs.copyFile(path.join(root, 'node_modules/socket.io-client/dist/socket.io.min.js'), path.join(outDir, 'socket.io/socket.io.js'));
  await fs.writeFile(path.join(outDir, '.nojekyll'), '');
  return outDir;
}

if (require.main === module) {
  buildPages().then(dir => console.log(`GitHub Pages listo: ${dir}`)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { buildPages, normalizeServerUrl };
