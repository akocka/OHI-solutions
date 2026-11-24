// POST /api/domain { siteId, hostname, action: 'add' | 'check' | 'remove' }
// Connects a client's own domain to their site through the Vercel API. Admins and up, paid plans only.
'use strict';
const L = require('./_lib');

const HOST = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const BLOCK = /(^|\.)(vercel\.app|vercel\.com|supabase\.co|ohi\.ro|localhost)$/;   // never let a client claim these

function vercel(path, method, body) {
  const team = L.env('VERCEL_TEAM_ID') ? (path.includes('?') ? '&' : '?') + 'teamId=' + encodeURIComponent(L.env('VERCEL_TEAM_ID')) : '';
  return fetch('https://api.vercel.com' + path + team, {
    method, headers: { Authorization: 'Bearer ' + L.env('VERCEL_API_TOKEN'), 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  }).then(async (r) => ({ ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) }));
}

module.exports = L.guard(async (req, res) => {
  if (req.method !== 'POST') return L.send(res, 405, { error: 'method' });
  if (!L.sameOrigin(req)) return L.send(res, 403, { error: 'origin' });
  if (L.missing('SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'VERCEL_API_TOKEN', 'VERCEL_PROJECT_ID').length) return L.send(res, 503, { error: 'not_configured' });

  const u = await L.user(req);
  if (!u) return L.send(res, 401, { error: 'login' });
  if (L.limited('dom:' + u.id, 30, 60 * 60 * 1000)) return L.send(res, 429, { error: 'slow_down' });

  const b = await L.readJson(req, 4 * 1024);
  const host = L.clean(b.hostname, 253).toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/\.$/, '');
  if (!HOST.test(host) || BLOCK.test(host)) return L.send(res, 400, { error: 'hostname' });

  const r = await L.siteRole(u, b.siteId);
  if (!r || !r.atLeast('admin')) return L.send(res, 403, { error: 'forbidden' });
  const pid = encodeURIComponent(L.env('VERCEL_PROJECT_ID'));
  const action = b.action || 'add';

  if (action === 'add') {
    const [org] = await L.db('orgs?select=plan&id=eq.' + r.site.org_id);
    if (org.plan === 'trial') return L.send(res, 402, { error: 'plan_required' });
    const taken = await L.db('domains?select=site_id&hostname=eq.' + encodeURIComponent(host));
    if (taken[0] && taken[0].site_id !== r.site.id) return L.send(res, 409, { error: 'taken' });
    const v = await vercel('/v10/projects/' + pid + '/domains', 'POST', { name: host });
    if (!v.ok && v.status !== 409) return L.send(res, 502, { error: 'vercel', code: v.data.error && v.data.error.code });
    if (!taken[0]) await L.db('domains', { method: 'POST', body: { site_id: r.site.id, hostname: host, status: 'verifying' }, prefer: 'return=minimal' });
    // what the client must set at their registrar (Vercel returns a TXT challenge when the domain is used elsewhere)
    return L.send(res, 200, { ok: true, verified: !!v.data.verified, verification: v.data.verification || [] });
  }

  const [row] = await L.db('domains?select=id&site_id=eq.' + r.site.id + '&hostname=eq.' + encodeURIComponent(host));
  if (!row) return L.send(res, 404, { error: 'not_found' });

  if (action === 'check') {
    const v = await vercel('/v9/projects/' + pid + '/domains/' + encodeURIComponent(host) + '/verify', 'POST');
    const ok = v.ok && v.data.verified;
    await L.db('domains?id=eq.' + row.id, { method: 'PATCH', body: ok ? { status: 'active', verified_at: new Date().toISOString() } : { status: 'verifying' }, prefer: 'return=minimal' });
    return L.send(res, 200, { ok: true, verified: !!ok, verification: v.data.verification || [] });
  }

  if (action === 'remove') {
    await vercel('/v9/projects/' + pid + '/domains/' + encodeURIComponent(host), 'DELETE');
    await L.db('domains?id=eq.' + row.id, { method: 'DELETE', prefer: 'return=minimal' });
    return L.send(res, 200, { ok: true });
  }
  L.send(res, 400, { error: 'action' });
});
