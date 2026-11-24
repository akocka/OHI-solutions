// POST /api/ai { siteId, prompt, model } — the AI builder.
// Claude gets the site's current model (without uploaded images) and the client's request, and answers
// with an updated model as JSON. We never trust that answer: every field is checked against a whitelist,
// texts are capped, HTML is impossible (the renderer escapes everything) and images can't be invented.
// Usage is limited per user and per organisation, and every call is logged.
'use strict';
const L = require('./_lib');

const TYPES = ['nav', 'hero', 'features', 'prices', 'gallery', 'faq', 'hours', 'cta', 'booking', 'calc', 'footer'];
const BRAND_ENUM = {
  btnShape: ['pill', 'round', 'square'], btnStyle: ['fill', 'outline', 'soft'],
  anim: ['none', 'fade', 'up', 'left', 'right', 'zoom', 'blur', 'flip'], animSpeed: ['fast', 'normal', 'slow'],
  density: ['compact', 'normal', 'airy'],
  headFont: ['fraunces', 'playfair', 'cormorant', 'instrument', 'archivo', 'manrope', 'inter', 'dmsans', 'poppins', 'schibsted'],
  bodyFont: ['fraunces', 'playfair', 'cormorant', 'instrument', 'archivo', 'manrope', 'inter', 'dmsans', 'poppins', 'schibsted']
};
const STYLE_ENUM = {
  bg: ['bg', 'surface', 'dark', 'accent'], pad: ['s', 'm', 'l'], align: ['left', 'center', 'right'], width: ['narrow', 'normal', 'wide'],
  anim: ['inherit', 'none', 'fade', 'up', 'left', 'right', 'zoom', 'blur', 'flip'], btn: ['inherit', 'fill', 'outline', 'soft'], img: ['left', 'right'],
  fx: ['none', 'split', 'parallax', 'zoom', 'drift', 'slide', 'cover']
};
const COLOR = /^#[0-9a-fA-F]{6}$/;
const DAILY = { trial: 20, start: 100, pro: 300, agency: 1000 };

const pick = (v, list, dflt) => (list.includes(v) ? v : dflt);

// deep-copy only text/number/array/object data, capping sizes; drops anything that looks like an image or URL
function cleanData(v, depth) {
  if (depth > 4) return undefined;
  if (typeof v === 'string') return /^(data:|https?:|javascript:)/i.test(v.trim()) ? undefined : L.clean(v, 600);
  if (typeof v === 'number' && isFinite(v)) return Math.max(-1e7, Math.min(1e7, v));
  if (typeof v === 'boolean') return v;
  if (Array.isArray(v)) return v.slice(0, 24).map((x) => cleanData(x, depth + 1)).filter((x) => x !== undefined);
  if (v && typeof v === 'object') {
    const o = {};
    Object.keys(v).slice(0, 30).forEach((k) => { if (/^[a-zA-Z]{1,20}$/.test(k)) { const c = cleanData(v[k], depth + 1); if (c !== undefined) o[k] = c; } });
    return o;
  }
  return undefined;
}

function sanitize(out, before) {
  const brand = Object.assign({}, before.brand);
  const ob = out.brand || {};
  Object.keys(BRAND_ENUM).forEach((k) => { if (ob[k] !== undefined) brand[k] = pick(ob[k], BRAND_ENUM[k], brand[k]); });
  if (typeof ob.radius === 'number') brand.radius = Math.max(0, Math.min(36, Math.round(ob.radius)));
  if (typeof ob.name === 'string') brand.name = L.clean(ob.name, 80);
  if (ob.colors && typeof ob.colors === 'object') {
    brand.colors = Object.assign({}, brand.colors);
    ['bg', 'ink', 'mute', 'surface', 'accent', 'dark'].forEach((k) => { if (COLOR.test(ob.colors[k] || '')) { brand.colors[k] = ob.colors[k]; brand.palette = 'custom'; } });
  }
  const oldById = {}; (before.blocks || []).forEach((b) => { oldById[b.id] = b; });
  const blocks = (Array.isArray(out.blocks) ? out.blocks : []).slice(0, 30).filter((b) => b && TYPES.includes(b.type)).map((b) => {
    const prev = oldById[b.id];
    const s = {}; const os = b.s || {};
    Object.keys(STYLE_ENUM).forEach((k) => { s[k] = pick(os[k], STYLE_ENUM[k], prev && prev.s ? prev.s[k] : STYLE_ENUM[k][0]); });
    const d = cleanData(b.d || {}, 0) || {};
    if (prev && prev.d) Object.keys(prev.d).forEach((k) => {                // keep the client's own photos and links
      const pv = prev.d[k];
      if (k === 'img' || k === 'imgs' || (d[k] === undefined && typeof pv === 'string' && /^https?:/i.test(pv))) d[k] = pv;
    });
    return {
      id: /^[a-z0-9]{2,12}$/i.test(b.id || '') ? b.id : 'b' + Math.random().toString(36).slice(2, 8),
      type: b.type, v: L.clean(b.v, 20), d, s, hidden: !!b.hidden
    };
  });
  if (!blocks.length) throw new Error('ai_empty');
  return { brand, blocks };
}

// images can be large data URLs: send placeholders to Claude, restore them afterwards
function stripImages(model) {
  return JSON.parse(JSON.stringify(model, (k, v) => (typeof v === 'string' && v.startsWith('data:') ? '[photo]' : v)));
}

const SYSTEM = [
  'You edit small business websites for the OHI platform. Reply with ONE JSON object and nothing else: {"brand":{...},"blocks":[...],"say":"..."}',
  'Keep the same structure as the model you receive. Allowed block types: ' + TYPES.join(', ') + '.',
  'Allowed values: ' + JSON.stringify({ brand: BRAND_ENUM, style: STYLE_ENUM }) + '. Colours are #RRGGBB.',
  'Keep existing block ids. Never invent prices, reviews, awards, phone numbers, addresses or claims the client did not give; leave those fields as they are or empty.',
  'Write in the language the site is already in (usually Romanian), plain and human, no hype. Use at most 3 brand colours in the palette (main, light background, accent).',
  '"say" is one short sentence for the client describing what you changed.'
].join('\n');

module.exports = L.guard(async (req, res) => {
  if (req.method !== 'POST') return L.send(res, 405, { error: 'method' });
  if (!L.sameOrigin(req)) return L.send(res, 403, { error: 'origin' });
  if (L.missing('SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'ANTHROPIC_API_KEY').length) return L.send(res, 503, { error: 'not_configured' });

  const u = await L.user(req);
  if (!u) return L.send(res, 401, { error: 'login' });
  if (L.limited('ai:' + u.id, 15, 10 * 60 * 1000)) return L.send(res, 429, { error: 'slow_down' });

  const b = await L.readJson(req, 3 * 1024 * 1024);
  const r = await L.siteRole(u, b.siteId);
  if (!r || !r.atLeast('editor')) return L.send(res, 403, { error: 'forbidden' });
  const prompt = L.clean(b.prompt, 1500);
  if (prompt.length < 3) return L.send(res, 400, { error: 'prompt' });
  const model = b.model && typeof b.model === 'object' && Array.isArray(b.model.blocks) ? b.model : null;
  if (!model) return L.send(res, 400, { error: 'model' });

  // daily allowance per organisation, counted from the audit log (survives restarts)
  const [org] = await L.db('orgs?select=plan&id=eq.' + r.site.org_id);
  const since = new Date(Date.now() - 864e5).toISOString();
  const used = await L.db('audit_log?select=id&action=eq.ai.request&org_id=eq.' + r.site.org_id + '&at=gte.' + since);
  if (used.length >= (DAILY[org.plan] || 20)) return L.send(res, 429, { error: 'daily_limit' });
  await L.db('audit_log', { method: 'POST', body: { org_id: r.site.org_id, actor: u.id, action: 'ai.request', target: r.site.id }, prefer: 'return=minimal' });

  const ai = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': L.env('ANTHROPIC_API_KEY'), 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: L.env('ANTHROPIC_MODEL') || 'claude-sonnet-5-5',
      max_tokens: 8000,
      system: SYSTEM,
      messages: [{ role: 'user', content: 'Current site model:\n' + JSON.stringify(stripImages(model)) + '\n\nClient request:\n' + prompt }]
    }),
    signal: AbortSignal.timeout(55000)
  });
  if (!ai.ok) { console.error('[ohi] anthropic', ai.status, (await ai.text()).slice(0, 300)); return L.send(res, 502, { error: 'ai_unavailable' }); }
  const out = await ai.json();
  const text = (out.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
  let parsed;
  try { parsed = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)); } catch (e) { return L.send(res, 502, { error: 'ai_bad_answer' }); }

  const next = sanitize(parsed, model);
  L.send(res, 200, { ok: true, model: next, say: L.clean(parsed.say, 240) });
});

module.exports.sanitize = sanitize;   // exported for tests
