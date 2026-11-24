// POST /api/lead — public contact/booking forms on client sites send here.
// Anyone on the internet can call this, so: honeypot, timing check, rate limit, length caps,
// and the lead is only stored if the site really exists and is published.
'use strict';
const L = require('./_lib');

module.exports = L.guard(async (req, res) => {
  // client sites live on their own domains, so this endpoint accepts any origin, without cookies
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') return L.send(res, 405, { error: 'method' });
  if (L.missing('SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY').length) return L.send(res, 503, { error: 'not_configured' });

  const b = await L.readJson(req, 16 * 1024);
  const slug = L.clean(b.site, 40).toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(slug)) return L.send(res, 400, { error: 'site' });
  if (L.limited('lead:' + L.ipOf(req) + ':' + slug, 5, 10 * 60 * 1000)) return L.send(res, 429, { error: 'slow_down' });

  // bots: filled the hidden field, or submitted faster than a person can type. Pretend success.
  if (b.website || (Number(b.t) > 0 && Number(b.t) < 2500)) return L.send(res, 200, { ok: true });

  const lead = {
    name: L.clean(b.name, 120), phone: L.clean(b.phone, 40), email: L.clean(b.email, 200).toLowerCase(),
    message: L.clean(b.message, 4000), source: L.clean(b.source, 60) || 'form'
  };
  if (!lead.phone && !lead.email) return L.send(res, 400, { error: 'contact' });
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) return L.send(res, 400, { error: 'email' });
  if (lead.phone && !/^[+0-9 ()./-]{6,40}$/.test(lead.phone)) return L.send(res, 400, { error: 'phone' });

  const site = await L.db('sites?select=id,status&slug=eq.' + encodeURIComponent(slug));
  if (!site[0] || !['live', 'preview'].includes(site[0].status)) return L.send(res, 404, { error: 'site' });

  await L.db('leads', { method: 'POST', body: Object.assign({ site_id: site[0].id }, lead), prefer: 'return=minimal' });

  // optional copy to an automation (Make, Zapier...). URL stays in env, never in page code.
  const fwd = L.env('LEADS_FORWARD_URL');
  if (fwd) {
    await fetch(fwd, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ site: slug }, lead)), signal: AbortSignal.timeout(4000) })
      .catch((e) => console.error('[ohi] forward failed', e.message));
  }
  L.send(res, 200, { ok: true });
});
