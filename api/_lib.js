// Shared helpers for OHI server functions. No npm packages: plain fetch (Node 18+).
// Files in /api that start with "_" are not exposed as endpoints.
//
// Environment variables (set in Vercel > Project > Settings > Environment Variables, never in code):
//   SUPABASE_URL               https://<project>.supabase.co
//   SUPABASE_ANON_KEY          public key, used to check a user's login token
//   SUPABASE_SERVICE_ROLE_KEY  secret, bypasses row level security: only used after our own checks
//   ANTHROPIC_API_KEY          secret, for the AI builder
//   ANTHROPIC_MODEL            optional, model id (check the current list at docs.claude.com)
//   VERCEL_API_TOKEN, VERCEL_PROJECT_ID, VERCEL_TEAM_ID   for client domains
//   LEADS_FORWARD_URL          optional, e.g. a Make webhook, so the URL never appears in page code
//   ALLOWED_ORIGINS            optional, comma list of extra origins allowed to call the dashboard APIs

'use strict';

const env = (k) => process.env[k] || '';
const missing = (...keys) => keys.filter((k) => !process.env[k]);

function send(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.statusCode = status;
  res.end(JSON.stringify(body));
}

// Refuse cross-site calls to dashboard endpoints (browsers always send Origin on POST).
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const extra = env('ALLOWED_ORIGINS').split(',').map((s) => s.trim()).filter(Boolean);
  return origin === 'https://' + host || extra.includes(origin);
}

// Best-effort limit per warm instance. Real limits also live in the database and in Vercel's firewall.
const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return list.length > max;
}
const ipOf = (req) => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';

async function readJson(req, maxBytes) {
  if (req.body && typeof req.body === 'object') return req.body;          // Vercel already parsed it
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > maxBytes) throw new Error('too_large'); chunks.push(c); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

// Supabase REST call. `token` = the user's own token (RLS applies) or null for the service role.
async function db(path, { method = 'GET', body, token, prefer } = {}) {
  const key = token ? env('SUPABASE_ANON_KEY') : env('SUPABASE_SERVICE_ROLE_KEY');
  const headers = { apikey: key, Authorization: 'Bearer ' + (token || key), 'Content-Type': 'application/json' };
  if (prefer) headers.Prefer = prefer;
  const r = await fetch(env('SUPABASE_URL') + '/rest/v1/' + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  if (!r.ok) { const e = new Error('db_' + r.status); e.status = r.status; e.detail = text.slice(0, 300); throw e; }
  return text ? JSON.parse(text) : null;
}

// Who is calling? Verifies the login token with Supabase Auth. Returns { id, token } or null.
async function user(req) {
  const h = String(req.headers.authorization || '');
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token || token.length > 4096) return null;
  const r = await fetch(env('SUPABASE_URL') + '/auth/v1/user', { headers: { apikey: env('SUPABASE_ANON_KEY'), Authorization: 'Bearer ' + token } });
  if (!r.ok) return null;
  const u = await r.json();
  return u && u.id ? { id: u.id, token } : null;
}

// The caller's role on a site, checked through RLS with their own token (so it cannot be faked).
const RANK = { owner: 0, admin: 1, editor: 2, viewer: 3 };
async function siteRole(u, siteId) {
  if (!/^[0-9a-f-]{36}$/.test(siteId || '')) return null;
  const s = await db('sites?select=id,org_id,slug,status&id=eq.' + siteId, { token: u.token });
  if (!s || !s[0]) return null;
  const m = await db('memberships?select=role&org_id=eq.' + s[0].org_id + '&user_id=eq.' + u.id, { token: u.token });
  return m && m[0] ? { site: s[0], role: m[0].role, atLeast: (r) => RANK[m[0].role] <= RANK[r] } : null;
}

const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);

function guard(handler) {
  return async (req, res) => {
    try { await handler(req, res); }
    catch (e) {
      console.error('[ohi]', e.message, e.detail || '');                // logs stay in Vercel, never sent to the browser
      send(res, e.message === 'too_large' ? 413 : 500, { error: e.message === 'too_large' ? 'too_large' : 'server_error' });
    }
  };
}

module.exports = { env, missing, send, sameOrigin, limited, ipOf, readJson, db, user, siteRole, clean, guard };
