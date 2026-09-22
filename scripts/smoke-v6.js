const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.join(__dirname, '..');
const port = 38180;
const db = path.join(root, 'data', 'smoke-v6.json');

const child = spawn(
  process.execPath,
  [path.join(root, 'server.js')],
  {
    env: {
      ...process.env,
      PORT: String(port),
      DB_PATH: db,
      ADMIN_EMAIL: 'admin@teste.local',
      ADMIN_PASSWORD: 'SmokePass-2026!'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  }
);

let stdout = '';
let stderr = '';

child.stdout.on('data', data => {
  stdout += data.toString();
});

child.stderr.on('data', data => {
  stderr += data.toString();
});

function req(p, method = 'GET', body = null, cookie = '') {
  return new Promise((resolve, reject) => {
    const headers = {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {})
    };

    const r = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: p,
        method,
        headers
      },
      res => {
        let s = '';

        res.on('data', c => {
          s += c;
        });

        res.on('end', () => {
          resolve({
            status: res.statusCode,
            body: s,
            headers: res.headers
          });
        });
      }
    );

    r.on('error', reject);

    if (body) {
      r.write(
        typeof body === 'string'
          ? body
          : JSON.stringify(body)
      );
    }

    r.end();
  });
}

async function waitForServer(timeoutMs = 10000) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await req('/health');

      if (response.status === 200) {
        return;
      }
    } catch {
      // Servidor ainda iniciando.
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  throw new Error(
    `server startup timeout\nstdout: ${stdout}\nstderr: ${stderr}`
  );
}

(async () => {
  try {
    await waitForServer();

    let a = await req('/health');

    if (a.status !== 200) {
      throw Error('health');
    }

    const h = JSON.parse(a.body);

    if (
      h.version !== '6.0.0' ||
      h.database !== true ||
      h.storage !== true
    ) {
      throw Error('health metadata');
    }

    for (const p of [
      '/',
      '/admin',
      '/api/settings',
      '/api/categories',
      '/api/dresses?mode=sale',
      '/api/dresses?mode=rental',
      '/api/videos'
    ]) {
      a = await req(p);

      if (a.status !== 200) {
        throw Error(p);
      }
    }

    a = await req('/api/clients');

    if (a.status !== 401) {
      throw Error('unauthenticated API');
    }

    a = await req(
      '/api/admin/login',
      'POST',
      {
        email: 'admin@teste.local',
        password: 'wrong'
      }
    );

    if (a.status !== 401) {
      throw Error('bad password');
    }

    a = await req(
      '/api/admin/login',
      'POST',
      {
        email: 'admin@teste.local',
        password: 'SmokePass-2026!'
      }
    );

    if (a.status !== 200) {
      throw Error('admin login');
    }

    const cookie =
      (a.headers['set-cookie'] || [])[0]?.split(';')[0];

    if (
      !cookie ||
      !cookie.startsWith('atelier_v6_session=')
    ) {
      throw Error('cookie');
    }

    a = await req(
      '/api/admin/me',
      'GET',
      null,
      cookie
    );

    if (a.status !== 200) {
      throw Error('admin me');
    }

    a = await req(
      '/api/admin/settings',
      'GET',
      null,
      cookie
    );

    if (a.status !== 200) {
      throw Error('admin settings GET');
    }

    a = await req(
      '/api/admin/settings',
      'PUT',
      { tagline: 'Smoke V6' },
      cookie
    );

    if (a.status !== 200) {
      throw Error('admin settings PUT');
    }

    a = await req(
      '/api/admin/clients',
      'POST',
      {
        name: 'Smoke Cliente',
        phone: '28999999999',
        occasion: 'Noiva'
      },
      cookie
    );

    if (a.status !== 201) {
      throw Error('client create');
    }

    const client = JSON.parse(a.body);

    a = await req(
      `/api/admin/clients/${client.id}`,
      'PATCH',
      { notes: 'Atualizado' },
      cookie
    );

    if (a.status !== 200) {
      throw Error('client patch');
    }

    a = await req(
      '/api/admin/appointments',
      'POST',
      {
        client_id: client.id,
        starts_at: '2026-09-22T14:00',
        type: 'consultation',
        duration_minutes: '60'
      },
      cookie
    );

    if (a.status !== 201) {
      throw Error('appointment create');
    }

    a = await req(
      '/api/admin/stats',
      'GET',
      null,
      cookie
    );

    if (
      a.status !== 200 ||
      JSON.parse(a.body).clients < 1
    ) {
      throw Error('stats');
    }

    a = await req(
      '/api/admin/logout',
      'POST',
      null,
      cookie
    );

    if (a.status !== 200) {
      throw Error('logout');
    }

    a = await req(
      '/api/admin/me',
      'GET',
      null,
      cookie
    );

    if (a.status !== 401) {
      throw Error('logout failed');
    }

    console.log(
      'SMOKE V6 PASS — site + admin login + settings + CRM clients + appointments + PATCH + stats + logout'
    );

  } catch (e) {
    console.error('SMOKE V6 FAIL:', e.message);

    if (stdout.trim()) {
      console.error('\nSERVER STDOUT:\n' + stdout.trim());
    }

    if (stderr.trim()) {
      console.error('\nSERVER STDERR:\n' + stderr.trim());
    }

    process.exitCode = 1;

  } finally {
    child.kill();

    try {
      fs.rmSync(db, { force: true });
    } catch {}
  }
})();
