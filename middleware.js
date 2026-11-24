// OHI hosting: serves each client's published site on the client's own domain.
// Runs before static files. For our own domains and Vercel preview links it does nothing, so the OHI
// website and the dashboard behave exactly as before. For a client domain it looks the domain up in
// the database and answers with that client's published site (home, pages, articles, sitemap, robots).
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (read-only use here), OHI_HOSTS (our own hosts, comma list)

export const config = { matcher: ['/((?!api/|app/|fonts/|_vercel/|favicon).*)'] };

const OWN = /(^localhost(:\d+)?$)|(\.vercel\.app$)|(^127\.0\.0\.1)/;
const cache = new Map();          // host -> { at, data }, per warm instance
const TTL = 60 * 1000;

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const jsonForScript = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

function ownHost(host) {
  if (!host || OWN.test(host)) return true;
  const list = (process.env.OHI_HOSTS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.includes(host);
}

async function db(path) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const r = await fetch(process.env.SUPABASE_URL + '/rest/v1/' + path, { headers: { apikey: key, Authorization: 'Bearer ' + key } });
  if (!r.ok) throw new Error('db_' + r.status);
  return r.json();
}

// host -> { site, model, primary } or null. Only published sites on verified domains.
async function lookup(host) {
  const hit = cache.get(host);
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  const alt = host.startsWith('www.') ? host.slice(4) : 'www.' + host;
  const doms = await db('domains?select=hostname,site_id,status&status=eq.active&hostname=in.(' + encodeURIComponent(host) + ',' + encodeURIComponent(alt) + ')');
  let data = null;
  const exact = doms.find((d) => d.hostname === host) || doms[0];
  if (exact) {
    const [site] = await db('sites?select=id,slug,name,status,published&id=eq.' + exact.site_id);
    if (site && site.status === 'live' && site.published) data = { site, model: site.published, primary: exact.hostname };
  }
  cache.set(host, { at: Date.now(), data });
  if (cache.size > 2000) cache.clear();
  return data;
}

const imgUrl = (v) => (typeof v === 'string' && /^https:\/\//.test(v) ? v : '');

function page(host, d, route, nf) {
  const m = d.model, base = 'https://' + host, brand = (m.brand && m.brand.name) || d.site.name;
  const pg = route.page ? (m.pages || []).find((p) => p.slug === route.page) : null;
  const po = route.post ? (m.posts || []).find((p) => p.slug === route.post && p.published) : null;
  const seo = po ? { title: po.title + ' · ' + brand, desc: po.excerpt, img: po.cover } : pg ? Object.assign({ title: pg.title + ' · ' + brand }, pg.seo) : Object.assign({ title: brand }, m.seo);
  const hero = (m.blocks || []).find((b) => b.type === 'hero');
  const h1 = po ? po.title : pg ? pg.title : hero && hero.d ? hero.d.title : brand;
  const canonical = base + (po ? '/noutati/' + po.slug : pg ? '/' + pg.slug : '/');
  const og = imgUrl(seo.img) || imgUrl(hero && hero.d && hero.d.img);
  const st = m.settings || {};
  const links = [['/', 'Acasă']].concat((m.pages || []).filter((p) => p.nav !== false).map((p) => ['/' + p.slug, p.title]));
  // plain HTML first (for search engines and very slow phones), then the renderer draws the full design
  return '<!DOCTYPE html><html lang="' + esc(st.lang || 'ro') + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + esc(seo.title || brand) + '</title><meta name="description" content="' + esc(seo.desc || '') + '"><link rel="canonical" href="' + esc(canonical) + '">' +
    (seo.noindex ? '<meta name="robots" content="noindex">' : '') +
    (st.gsv ? '<meta name="google-site-verification" content="' + esc(st.gsv) + '">' : '') +
    '<meta property="og:type" content="' + (po ? 'article' : 'website') + '"><meta property="og:title" content="' + esc(seo.title || brand) + '"><meta property="og:description" content="' + esc(seo.desc || '') + '"><meta property="og:url" content="' + esc(canonical) + '">' +
    (og ? '<meta property="og:image" content="' + esc(og) + '">' : '') +
    '<meta name="theme-color" content="' + esc((m.brand && m.brand.colors && m.brand.colors.bg) || '#ffffff') + '">' +
    '<link rel="stylesheet" href="/fonts/fonts.css"><link rel="stylesheet" href="/app/render.css"></head><body>' +
    '<main id="site"><nav><ul>' + links.map((l) => '<li><a href="' + esc(l[0]) + '">' + esc(l[1]) + '</a></li>').join('') + '</ul></nav><h1>' + esc(h1) + '</h1>' + (seo.desc ? '<p>' + esc(seo.desc) + '</p>' : '') + '</main>' +
    '<script type="application/json" id="ohi-data">' + jsonForScript({ model: m, slug: d.site.slug, page: pg ? pg.slug : null, post: po ? po.slug : null, nf: !!nf }) + '</script>' +
    '<script src="/app/render.js" defer></script></body></html>';
}

function headers(type, cacheable) {
  return {
    'Content-Type': type,
    'Cache-Control': cacheable ? 'public, max-age=0, s-maxage=60, stale-while-revalidate=600' : 'no-store',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
  };
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const host = (request.headers.get('host') || url.host).toLowerCase().replace(/:\d+$/, '');
  if (ownHost(host)) return;                                      // our sites: continue as usual
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  let d;
  try { d = await lookup(host); } catch (e) { console.error('[ohi-host]', e.message); return new Response('Site temporar indisponibil.', { status: 503, headers: headers('text/plain; charset=utf-8', false) }); }
  if (!d) return new Response('Acest domeniu nu are încă un site publicat.', { status: 404, headers: headers('text/plain; charset=utf-8', false) });

  // one address only: www and non-www go to the primary domain
  if (host !== d.primary) return Response.redirect('https://' + d.primary + url.pathname + url.search, 301);

  const m = d.model, path = decodeURIComponent(url.pathname).replace(/\/+$/, '') || '/';
  if (path === '/robots.txt') return new Response('User-agent: *\nAllow: /\nSitemap: https://' + host + '/sitemap.xml\n', { headers: headers('text/plain; charset=utf-8', true) });
  if (path === '/sitemap.xml') {
    const urls = ['/'].concat((m.pages || []).filter((p) => !(p.seo && p.seo.noindex)).map((p) => '/' + p.slug), (m.posts || []).filter((p) => p.published).map((p) => '/noutati/' + p.slug));
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.map((u) => '<url><loc>https://' + esc(host + u) + '</loc></url>').join('') + '</urlset>', { headers: headers('application/xml; charset=utf-8', true) });
  }
  let route = {};
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 2 && parts[0] === 'noutati') route = { post: parts[1] };
  else if (parts.length === 1) route = { page: parts[0] };
  else if (parts.length) route = { missing: true };
  const found = !route.missing && (!route.page || (m.pages || []).some((p) => p.slug === route.page)) && (!route.post || (m.posts || []).some((p) => p.slug === route.post && p.published));
  if (!found) {
    const h = headers('text/html; charset=utf-8', false);
    return new Response(page(host, d, {}, true).replace('<title>', '<title>Pagina nu există · ').replace('<meta name="description"', '<meta name="robots" content="noindex"><meta name="description"'), { status: 404, headers: h });
  }
  return new Response(page(host, d, route), { headers: headers('text/html; charset=utf-8', true) });
}
