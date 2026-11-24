// Tests middleware.js (client-domain hosting) with fake database answers. `node api-tests/hosting.mjs`
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const dir = mkdtempSync(join(tmpdir(), 'ohi-'));
writeFileSync(join(dir, 'mw.mjs'), readFileSync(new URL('../middleware.js', import.meta.url)));
const { default: mw } = await import(join(dir, 'mw.mjs'));
let fails = 0; const ok = (c, l) => { console.log((c ? 'PASS ' : 'FAIL ') + l); if (!c) fails++; };

const model = {
  brand: { name: 'Salon Ana', colors: { bg: '#fff' } }, seo: { title: 'Salon Ana · Cluj', desc: 'Tunsori </script><script>alert(1)</script>' },
  blocks: [{ id: 'h', type: 'hero', d: { title: 'Bun venit' }, s: {} }],
  pages: [{ id: 'p1', slug: 'contact', title: 'Contact', nav: true, seo: {}, blocks: [] }, { id: 'p2', slug: 'secret', title: 'Intern', nav: false, seo: { noindex: true }, blocks: [] }],
  posts: [{ slug: 'terasa', title: 'Terasa', published: true, excerpt: 'x' }, { slug: 'ciorna', title: 'Ciornă', published: false }],
  settings: { lang: 'ro', gsv: 'abc123' }
};
let SITE = { id: 's1', slug: 'salon-ana', name: 'Salon Ana', status: 'live', published: model };
const DOMAINS = [{ hostname: 'salonana.ro', site_id: 's1', status: 'active' }];
let dbCalls = 0;
globalThis.fetch = async (url) => {
  dbCalls++; const u = new URL(url);
  const body = u.pathname.endsWith('/domains') ? DOMAINS.filter((d) => decodeURIComponent(u.search).includes(d.hostname)) : u.pathname.endsWith('/sites') ? [SITE] : [];
  return { ok: true, status: 200, json: async () => body };
};
const req = (host, path) => new Request('https://' + host + path, { headers: { host } });

ok((await mw(req('ohis-gamma.vercel.app', '/'))) === undefined, 'our own domains pass through untouched');
ok((await mw(req('localhost:8816', '/'))) === undefined, 'local development passes through');
process.env.OHI_HOSTS = 'ohi.ro,www.ohi.ro';
ok((await mw(req('ohi.ro', '/'))) === undefined, 'OHI main domain passes through');
ok((await mw(req('salonana.ro', '/'))) === undefined, 'without database keys nothing is taken over');
process.env.SUPABASE_URL = 'https://db.example'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';

let r = await mw(req('necunoscut.ro', '/'));
ok(r.status === 404, 'unknown domain: 404, nothing leaks');
r = await mw(req('www.salonana.ro', '/contact?x=1'));
ok(r.status === 301 && r.headers.get('location') === 'https://salonana.ro/contact?x=1', 'www goes to the main address');
r = await mw(req('salonana.ro', '/')); let html = await r.text();
ok(r.status === 200 && html.includes('<title>Salon Ana · Cluj</title>'), 'home page with its Google title');
ok(!html.includes('</script><script>alert(1)'), 'text cannot break out of the page (script injection blocked)');
ok(html.includes('google-site-verification" content="abc123"'), 'Search Console verification tag');
ok(r.headers.get('content-security-policy').includes("script-src 'self'") && r.headers.get('content-security-policy').includes("frame-ancestors 'none'"), 'strict security headers on client sites');
ok(html.includes('<link rel="canonical" href="https://salonana.ro/">'), 'canonical address');
ok(!html.includes('>Intern<'), 'pages hidden from the menu are not linked');
r = await mw(req('salonana.ro', '/contact')); html = await r.text();
ok(r.status === 200 && html.includes('"page":"contact"') && html.includes('<title>Contact · Salon Ana</title>'), 'extra page');
r = await mw(req('salonana.ro', '/noutati/terasa')); html = await r.text();
ok(r.status === 200 && html.includes('"post":"terasa"') && html.includes('og:type" content="article"'), 'blog article');
r = await mw(req('salonana.ro', '/noutati/ciorna'));
ok(r.status === 404, 'draft articles are not public');
r = await mw(req('salonana.ro', '/nu-exista'));
ok(r.status === 404 && (await r.text()).includes('"nf":true'), 'missing page: real 404 with the site design');
r = await mw(req('salonana.ro', '/sitemap.xml')); const sm = await r.text();
ok(sm.includes('https://salonana.ro/contact') && sm.includes('/noutati/terasa') && !sm.includes('secret') && !sm.includes('ciorna'), 'sitemap: public pages only');
r = await mw(req('salonana.ro', '/robots.txt'));
ok((await r.text()).includes('Sitemap: https://salonana.ro/sitemap.xml'), 'robots.txt points to the sitemap');
const before = dbCalls; await mw(req('salonana.ro', '/')); await mw(req('salonana.ro', '/contact'));
ok(dbCalls === before, 'repeat visits served from memory (no database call)');
SITE = Object.assign({}, SITE, { status: 'paused' });
const { default: mw2 } = await import(join(dir, 'mw.mjs') + '?fresh');
r = await mw2(req('salonana.ro', '/'));
ok(r.status === 404, 'paused sites are not shown');

console.log('\n' + (fails ? fails + ' failed' : 'all passed')); process.exit(fails ? 1 : 0);
