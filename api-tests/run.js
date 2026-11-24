// Runs the API functions against fake Supabase / Anthropic / Vercel responses. `node api-tests/run.js`
'use strict';
const path = require('path');
const A = (f) => require(path.join(__dirname, '..', 'api', f));
let calls = [], fails = 0, passes = 0;
const ok = (c, label) => { if (c) { passes++; console.log('PASS ', label); } else { fails++; console.log('FAIL ', label); } };

const USERS = { 'tok-ana': 'ua', 'tok-cris': 'uc' };
const ROLE = { ua: 'owner', uc: 'viewer' };
let SITE = { id: '11111111-1111-1111-1111-111111111111', org_id: 'o1', slug: 'salon-ana', status: 'live', draft: { brand: {}, blocks: [] } };
let PLAN = 'pro';
let aiAnswer = '';

global.fetch = async (url, o = {}) => {
  calls.push({ url, o });
  const j = (status, body) => ({ ok: status < 300, status, json: async () => body, text: async () => JSON.stringify(body) });
  const u = new URL(url);
  if (u.pathname === '/auth/v1/user') { const id = USERS[(o.headers.Authorization || '').slice(7)]; return id ? j(200, { id }) : j(401, {}); }
  if (u.pathname.startsWith('/rest/v1/')) {
    const t = u.pathname.slice(9), q = u.search;
    if (o.method && o.method !== 'GET') return j(201, null);
    if (t === 'sites') return j(200, q.includes(SITE.slug) || q.includes(SITE.id) ? [SITE] : []);
    if (t === 'memberships') { const uid = (q.match(/user_id=eq\.(\w+)/) || [])[1]; return j(200, ROLE[uid] ? [{ role: ROLE[uid] }] : []); }
    if (t === 'orgs') return j(200, [{ plan: PLAN }]);
    if (t === 'audit_log' || t === 'domains') return j(200, []);
  }
  if (u.host === 'api.anthropic.com') return j(200, { content: [{ type: 'text', text: aiAnswer }] });
  if (u.host === 'api.vercel.com') return j(200, { verified: false, verification: [{ type: 'TXT', domain: '_vercel.x.ro', value: 'v' }] });
  if (u.host === 'hook.example') return j(200, {});
  throw new Error('unexpected fetch ' + url);
};

function call(fn, { method = 'POST', body = {}, headers = {} } = {}) {
  return new Promise((resolve) => {
    const res = { headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, end(b) { resolve({ status: this.statusCode, body: b ? JSON.parse(b) : null, headers: this.headers }); } };
    fn({ method, body, headers: Object.assign({ host: 'app.ohi.test', 'x-forwarded-for': '1.2.3.' + Math.floor(Math.random() * 250) }, headers) }, res);
  });
}

(async () => {
  const lead = A('lead.js'), ai = A('ai.js'), dom = A('domain.js'), pub = A('publish.js');

  // nothing configured yet
  let r = await call(lead, { body: { site: 'salon-ana', phone: '0740000000' } });
  ok(r.status === 503, 'without keys the API refuses instead of half-working');

  Object.assign(process.env, { SUPABASE_URL: 'https://db.example', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service', ANTHROPIC_API_KEY: 'k', VERCEL_API_TOKEN: 'v', VERCEL_PROJECT_ID: 'p', LEADS_FORWARD_URL: 'https://hook.example/x' });

  // ---- public lead form
  r = await call(lead, { body: { site: '../../etc', phone: '0740000000' } });
  ok(r.status === 400, 'lead: weird site name rejected');
  calls = [];
  r = await call(lead, { body: { site: 'salon-ana', phone: '0740000000', website: 'http://spam' } });
  ok(r.status === 200 && !calls.some((c) => c.url.includes('/rest/')), 'lead: honeypot bot gets "ok" but nothing is saved');
  r = await call(lead, { body: { site: 'salon-ana', email: 'not-an-email' } });
  ok(r.status === 400, 'lead: bad e-mail rejected');
  calls = [];
  r = await call(lead, { body: { site: 'salon-ana', name: 'Ion', phone: '0740 000 000', message: 'x'.repeat(9000) } });
  const ins = calls.find((c) => c.url.endsWith('/rest/v1/leads'));
  ok(r.status === 200 && ins && JSON.parse(ins.o.body).message.length === 4000, 'lead: saved, long message capped');
  ok(ins && ins.o.headers.Authorization === 'Bearer service', 'lead: stored with the server key, not exposed to the page');
  ok(calls.some((c) => c.url.startsWith('https://hook.example')), 'lead: forwarded to the automation URL kept in env');
  SITE.status = 'draft';
  r = await call(lead, { body: { site: 'salon-ana', phone: '0740000000' } });
  ok(r.status === 404, 'lead: unpublished sites do not collect leads');
  SITE.status = 'live';
  let last;
  for (let i = 0; i < 6; i++) last = await call(lead, { body: { site: 'salon-ana', phone: '0740000000' }, headers: { 'x-forwarded-for': '9.9.9.9' } });
  ok(last.status === 429, 'lead: 6th message in 10 minutes from one IP is refused');

  // ---- AI builder
  r = await call(ai, { body: { siteId: SITE.id, prompt: 'fa-l verde', model: { brand: {}, blocks: [] } } });
  ok(r.status === 401, 'ai: needs login');
  r = await call(ai, { body: { siteId: SITE.id, prompt: 'fa-l verde', model: { brand: {}, blocks: [] } }, headers: { authorization: 'Bearer tok-cris' } });
  ok(r.status === 403, 'ai: viewers cannot change the site');
  r = await call(ai, { body: { siteId: SITE.id, prompt: 'x', model: {} }, headers: { authorization: 'Bearer tok-ana', origin: 'https://evil.example' } });
  ok(r.status === 403, 'ai: calls from other websites refused');

  const model = { brand: { name: 'Salon', colors: { bg: '#ffffff', ink: '#111111', mute: '#666666', surface: '#eeeeee', accent: '#c2456b', dark: '#222222' }, btnShape: 'pill', radius: 14 },
    blocks: [{ id: 'h1', type: 'hero', v: 'split', d: { title: 'Salut', img: 'data:image/jpeg;base64,AAAA', link: 'https://instagram.com/salon' }, s: { bg: 'bg', fx: 'none' } }] };
  aiAnswer = 'Sure! ' + JSON.stringify({
    say: 'Am făcut verde.',
    brand: { colors: { accent: '#2f6b45', bg: 'red;background:url(x)' }, btnShape: 'blob', radius: 999, anim: 'blur' },
    blocks: [
      { id: 'h1', type: 'hero', v: 'split', d: { title: '<script>alert(1)</script>Verde', img: 'https://evil.example/x.jpg', btn: 'javascript:alert(1)' }, s: { fx: 'split', bg: 'url(x)' } },
      { id: 'zz', type: 'iframe', d: { src: 'https://evil.example' } },
      { id: 'c1', type: 'cta', d: { title: 'Programează-te', __proto__x: 1 }, s: {} }
    ]
  });
  calls = [];
  r = await call(ai, { body: { siteId: SITE.id, prompt: 'fa-l verde si mai modern', model }, headers: { authorization: 'Bearer tok-ana' } });
  const sent = calls.find((c) => c.url.includes('anthropic'));
  ok(r.status === 200, 'ai: owner gets an answer');
  ok(sent && !sent.o.body.includes('base64'), 'ai: client photos are not sent to the AI');
  ok(sent && sent.o.headers['x-api-key'] === 'k' && !JSON.stringify(r.body).includes('"k"'), 'ai: API key stays on the server');
  const m = r.body.model || { brand: {}, blocks: [] };
  ok(m.brand.colors.accent === '#2f6b45' && m.brand.colors.bg === '#ffffff', 'ai: valid colour applied, CSS injection ignored');
  ok(m.brand.btnShape === 'pill' && m.brand.radius === 36 && m.brand.anim === 'blur', 'ai: only allowed design values pass');
  ok(m.blocks.length === 2 && !m.blocks.some((b) => b.type === 'iframe'), 'ai: unknown block types (iframe) dropped');
  const h = m.blocks[0];
  ok(h.d.img === model.blocks[0].d.img, 'ai: cannot swap the client photo for an outside image');
  ok(h.d.btn === undefined, 'ai: javascript: links dropped');
  ok(h.d.link === 'https://instagram.com/salon', 'ai: the client\'s own links are kept');
  ok(h.s.fx === 'split' && h.s.bg === 'bg', 'ai: per-section effects allowed, bad style values ignored');
  ok(h.d.title.includes('<script>'), 'ai: text stays plain text (the renderer escapes it on display)');

  // ---- domains
  r = await call(dom, { body: { siteId: SITE.id, hostname: 'evil.vercel.app' }, headers: { authorization: 'Bearer tok-ana' } });
  ok(r.status === 400, 'domain: cannot claim platform domains');
  r = await call(dom, { body: { siteId: SITE.id, hostname: 'salonana.ro' }, headers: { authorization: 'Bearer tok-cris' } });
  ok(r.status === 403, 'domain: viewers cannot add domains');
  PLAN = 'trial';
  r = await call(dom, { body: { siteId: SITE.id, hostname: 'salonana.ro' }, headers: { authorization: 'Bearer tok-ana' } });
  ok(r.status === 402, 'domain: custom domains need a paid plan');
  PLAN = 'pro'; calls = [];
  r = await call(dom, { body: { siteId: SITE.id, hostname: 'https://SalonAna.ro/' }, headers: { authorization: 'Bearer tok-ana' } });
  const vc = calls.find((c) => c.url.includes('api.vercel.com'));
  ok(r.status === 200 && vc && JSON.parse(vc.o.body).name === 'salonana.ro', 'domain: cleaned and sent to Vercel');
  ok(r.body.verification && r.body.verification[0].type === 'TXT', 'domain: client gets the DNS record to set');

  // ---- publish
  PLAN = 'trial';
  r = await call(pub, { body: { siteId: SITE.id }, headers: { authorization: 'Bearer tok-ana' } });
  ok(r.status === 200 && r.body.status === 'preview', 'publish: trial sites go to preview only');
  PLAN = 'pro';
  r = await call(pub, { body: { siteId: SITE.id }, headers: { authorization: 'Bearer tok-ana' } });
  ok(r.body.status === 'live', 'publish: paid sites go live');
  r = await call(pub, { body: { siteId: SITE.id }, headers: { authorization: 'Bearer tok-cris' } });
  ok(r.status === 403, 'publish: viewers cannot publish');
  r = await call(pub, { method: 'GET' });
  ok(r.status === 405 && r.headers['Cache-Control'] === 'no-store', 'responses are never cached');

  console.log(`\n${passes} passed, ${fails} failed`);
  process.exit(fails ? 1 : 0);
})();
