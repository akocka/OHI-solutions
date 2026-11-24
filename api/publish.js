// POST /api/publish { siteId } — copies the editor draft to the published version.
// Editors and up. Sites on a trial plan publish to the preview link only.
'use strict';
const L = require('./_lib');

module.exports = L.guard(async (req, res) => {
  if (req.method !== 'POST') return L.send(res, 405, { error: 'method' });
  if (!L.sameOrigin(req)) return L.send(res, 403, { error: 'origin' });
  if (L.missing('SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY').length) return L.send(res, 503, { error: 'not_configured' });

  const u = await L.user(req);
  if (!u) return L.send(res, 401, { error: 'login' });
  if (L.limited('pub:' + u.id, 20, 60 * 60 * 1000)) return L.send(res, 429, { error: 'slow_down' });

  const b = await L.readJson(req, 4 * 1024);
  const r = await L.siteRole(u, b.siteId);
  if (!r || !r.atLeast('editor')) return L.send(res, 403, { error: 'forbidden' });

  const [site] = await L.db('sites?select=id,org_id,draft&id=eq.' + r.site.id);
  const [org] = await L.db('orgs?select=plan&id=eq.' + site.org_id);
  const status = org.plan === 'trial' ? 'preview' : 'live';
  const now = new Date().toISOString();

  await L.db('site_versions', { method: 'POST', body: { site_id: site.id, model: site.draft, note: 'publicat', created_by: u.id }, prefer: 'return=minimal' });
  await L.db('sites?id=eq.' + site.id, { method: 'PATCH', body: { published: site.draft, published_at: now, status }, prefer: 'return=minimal' });
  L.send(res, 200, { ok: true, status, publishedAt: now });
});
