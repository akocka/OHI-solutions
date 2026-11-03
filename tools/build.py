#!/usr/bin/env python3
"""Builds every page of ohis-gamma.vercel.app with ONE shared header, menu and footer.

    python3 tools/build.py            # rebuild all pages

- New pages: written from tools/pages/<name>.html (a META json comment + <main>…</main>).
  They load shell.css + ohi.css and shell.js + ohi.js (+ any extra js listed in META).
- Older pages (blog articles, legal, niche landings…): their <main> content is kept and only the
  shell is swapped. They keep site.css/pages.css + motion.js/site.js for their content.
  The kept parts are wrapped in <!--OHI:…--> markers so the script can run again safely.

Change the menu in NAV/MNAV below, run the script, and every page updates.
"""
import json, os, re, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://ohis-gamma.vercel.app'
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         '<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet">')

# ---- the one menu ---------------------------------------------------------
NAV = [('/portofoliu', 'Portofoliu', 'Lucrări reale'),
       ('/creare-site-web', 'Site-uri', 'Site de prezentare'),
       ('/automatizari', 'Automatizări', 'Nicio cerere pierdută'),
       ('/asistent-ai', 'Asistent AI', 'Răspunde și seara'),
       ('/preturi', 'Prețuri', 'Plată unică, de la 500 lei'),
       ('/cum-lucram', 'Cum lucrăm', 'În 3 pași'),
       ('/contact', 'Contact', 'Târgu Mureș')]
MNAV = NAV[:6] + [('/blog', 'Blog', 'Sfaturi utile')] + NAV[6:]

LOGO = ('<svg viewBox="0 18 359 170" role="img" aria-hidden="true"><rect x="24" y="46" width="112" height="112" rx="30" fill="none" stroke="#3346E8" stroke-width="26" transform="rotate(-10 80 102)"/>'
        '<path d="M233.9 160V61h21.45v99ZM168.95 160V61h21.6v99ZM181.7 118.75v-17.7h60.75v17.7ZM277.4 160V61h22.05v99Z" fill="currentColor"/><circle cx="332.4" cy="150" r="13" fill="#FFB020"/></svg>')


def section_of(path):
    """Which menu item is 'current' for a page path."""
    if path.startswith('/blog'):
        return '/blog'
    if path.startswith('/site-uri-') or path == '/solutii-personalizate':
        return '/creare-site-web'
    if path == '/constructor':
        return '/contact'
    return path


def cur(href, path):
    return ' aria-current="page"' if section_of(path) == href else ''


def header(path):
    nav = ''.join(f'<a href="{h}"{cur(h, path)}>{t}</a>' for h, t, _ in NAV)
    mnav = ''.join(f'<a class="o-ml" href="{h}"{cur(h, path)}>{t}<span>{s}</span></a>' for h, t, s in MNAV)
    return (f'<a class="o-skip" href="#main">Sari la conținut</a>\n'
            f'<div class="o-hd" id="ohd" role="banner"><div class="o-wrap">\n'
            f'  <a class="o-logo" href="/" aria-label="OHI Solutions, pagina principală">{LOGO}</a>\n'
            f'  <div class="o-nav" role="navigation" aria-label="Principal">{nav}</div>\n'
            f'  <div class="o-cta"><a class="o-btn o-g" href="tel:+40740267706">0740 267 706</a>'
            f'<a class="o-btn o-a" href="/contact#demo"><span class="o-l">Cere demo gratuit</span><span class="o-s">Demo gratuit</span></a>'
            f'<button class="o-burger" id="oburger" type="button" aria-label="Meniu" aria-expanded="false" aria-controls="omnav"><i></i><i></i></button></div>\n'
            f'  <span class="o-prog" id="oprog" aria-hidden="true"></span>\n'
            f'</div></div>\n'
            f'<div class="o-mnav" id="omnav" role="navigation" aria-label="Meniu mobil">\n  {mnav}\n'
            f'  <div class="o-mfoot"><a class="o-btn o-a" href="/contact#demo">Cere demo gratuit</a><a class="o-btn o-g" href="tel:+40740267706">Sună: 0740 267 706</a></div>\n'
            f'</div>')


FOOTER = ('<div class="o-ft" role="contentinfo"><div class="o-wrap">\n'
          '  <div class="o-ftg">\n'
          f'    <div><a class="o-logo" href="/" aria-label="OHI Solutions">{LOGO}</a><p class="o-about">Site-uri și automatizări pentru afaceri locale din Târgu Mureș și din toată România.</p></div>\n'
          '    <div><h4>Servicii</h4><ul><li><a href="/creare-site-web">Site-uri</a></li><li><a href="/automatizari">Automatizări</a></li><li><a href="/asistent-ai">Asistent AI</a></li><li><a href="/solutii-personalizate">Funcții extra</a></li><li><a href="/preturi">Prețuri</a></li></ul></div>\n'
          '    <div><h4>Pentru</h4><ul><li><a href="/site-uri-restaurante">Restaurante</a></li><li><a href="/site-uri-saloane">Saloane și frizerii</a></li><li><a href="/site-uri-service-auto">Service auto</a></li><li><a href="/constructor">Trimite-ne datele</a></li></ul></div>\n'
          '    <div><h4>OHI</h4><ul><li><a href="/portofoliu">Portofoliu</a></li><li><a href="/cum-lucram">Cum lucrăm</a></li><li><a href="/blog">Blog</a></li><li><a href="/contact">Contact</a></li></ul></div>\n'
          '    <div><h4>Contact</h4><ul><li><a class="o-tel" href="tel:+40740267706">0740 267 706</a></li><li><a href="https://wa.me/40740267706" target="_blank" rel="noopener">Scrie-ne pe WhatsApp</a></li><li>Târgu Mureș, județul Mureș</li></ul></div>\n'
          '  </div>\n'
          '  <div class="o-ftb"><span>© 2026 OHI Solutions · Târgu Mureș</span><span><a href="/confidentialitate">Confidențialitate</a> &nbsp;·&nbsp; <a href="/termeni">Termeni</a></span></div>\n'
          '</div></div>')

COMMON_HEAD = ('<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n')
ICONS = ('<meta name="theme-color" content="#07080D">\n<link rel="icon" href="/favicon.ico" sizes="any">\n'
         '<link rel="icon" href="/icon-512.png" type="image/png">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">')


def esc(s):
    return s.replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;')


def native_meta(m):
    url = SITE + (m['path'] if m['path'] != '/' else '/')
    t, d = esc(m['title']), esc(m['desc'])
    out = [f'<title>{t}</title>', f'<meta name="description" content="{d}">',
           f'<link rel="canonical" href="{url}">', f'<meta name="robots" content="{m.get("robots", "index, follow")}">',
           '<meta property="og:type" content="website">', '<meta property="og:locale" content="ro_RO">',
           '<meta property="og:site_name" content="OHI Solutions">', f'<meta property="og:title" content="{esc(m.get("og_title", m["title"]))}">',
           f'<meta property="og:description" content="{d}">', f'<meta property="og:url" content="{url}">',
           f'<meta property="og:image" content="{SITE}/og-image.png">', '<meta property="og:image:width" content="1200">',
           '<meta property="og:image:height" content="630">', '<meta name="twitter:card" content="summary_large_image">']
    if m.get('ld'):
        out.append('<script type="application/ld+json">' + json.dumps(m['ld'], ensure_ascii=False) + '</script>')
    if m.get('head'):
        out.append(m['head'])
    return '\n'.join(out)


def build_native(frag_path):
    src = open(frag_path, encoding='utf-8').read()
    mm = re.match(r'\s*<!--META\s*(\{.*?\})\s*-->\s*(.*)$', src, re.S)
    if not mm:
        sys.exit('no META in ' + frag_path)
    meta, main = json.loads(mm.group(1)), mm.group(2).strip()
    path = meta['path']
    js = ''.join(f'<script src="{j}" defer></script>\n' for j in meta.get('js', []))
    html = ('<!DOCTYPE html>\n<html lang="ro">\n<head>\n' + COMMON_HEAD + native_meta(meta) + '\n' + ICONS + '\n' + FONTS + '\n'
            '<link rel="stylesheet" href="/shell.css">\n<link rel="stylesheet" href="/ohi.css">\n</head>\n'
            f'<body data-ohi="new">\n{header(path)}\n{main}\n{FOOTER}\n'
            '<script src="/shell.js" defer></script>\n<script src="/ohi.js" defer></script>\n' + js +
            '<script src="/assistant.js" defer></script>\n</body>\n</html>\n')
    name = 'index' if path == '/' else path.strip('/')
    out = os.path.join(ROOT, name + '.html')
    open(out, 'w', encoding='utf-8').write(html)
    return out


LEGACY_DROP_SRC = ('/motion.js', '/space.js', '/site.js', '/assistant.js')
LINK_FIXES = [('href="/#cum"', 'href="/cum-lucram"'), ('Încearcă demo-ul live', 'Vezi cum lucrăm'),
              ('href="/#demo"', 'href="/contact#demo"'), ('<span>Despre și contact</span>', '<span>Contact</span>')]


def extract_legacy(s):
    """Return (meta, main, pagejs, bodycls) from an old-style page or from a page already built by this script."""
    if '<!--OHI:MAIN-->' in s:
        g = lambda k: re.search(rf'<!--OHI:{k}-->(.*?)<!--/OHI:{k}-->', s, re.S).group(1)
        bc = re.search(r'<body class="([^"]*)"', s)
        return g('META'), g('MAIN'), g('PAGEJS'), bc.group(1) if bc else ''
    head = re.search(r'<head>(.*?)</head>', s, re.S).group(1)
    keep = []
    for m in re.finditer(r'<title>.*?</title>|<meta (?:name|property)="[^"]+"[^>]*>|<link rel="canonical"[^>]*>|'
                         r'<script type="application/ld\+json">.*?</script>|<script type="importmap">.*?</script>|<style>.*?</style>', head, re.S):
        t = m.group(0)
        if 'name="viewport"' in t or 'name="theme-color"' in t:
            continue
        keep.append(t)
    main = re.search(r'<main[^>]*>.*?</main>', s, re.S).group(0)
    tail = s.split('</main>', 1)[1]
    tail = re.sub(r'<footer>.*?</footer>', '', tail, flags=re.S)
    js = []
    for m in re.finditer(r'<script([^>]*)>(.*?)</script>', tail, re.S):
        attrs, body = m.group(1), m.group(2)
        srcm = re.search(r'src="([^"]+)"', attrs)
        if srcm and srcm.group(1) in LEGACY_DROP_SRC:
            continue
        js.append(m.group(0))
    bc = re.search(r'<body class="([^"]*)"', s)
    return '\n'.join(keep), main, '\n'.join(js), bc.group(1) if bc else ''


def build_legacy(fname):
    p = os.path.join(ROOT, fname)
    s = open(p, encoding='utf-8').read()
    meta, main, pagejs, bodycls = extract_legacy(s)
    for a, b in LINK_FIXES:
        main = main.replace(a, b)
    # old <main id="top"> → id="main" so the skip link works; keep any other attributes
    main = re.sub(r'<main(?: id="[^"]*")?', '<main id="main"', main, count=1)
    path = '/' + fname[:-5]
    html = ('<!DOCTYPE html>\n<html lang="ro">\n<head>\n' + COMMON_HEAD +
            '<!--OHI:META-->' + meta + '<!--/OHI:META-->\n' + ICONS + '\n' + FONTS + '\n'
            '<link rel="stylesheet" href="/site.css">\n<link rel="stylesheet" href="/pages.css">\n<link rel="stylesheet" href="/shell.css">\n</head>\n'
            f'<body class="{bodycls}" data-ohi="legacy">\n{header(path)}\n<!--OHI:MAIN-->{main}<!--/OHI:MAIN-->\n{FOOTER}\n'
            '<script src="/motion.js"></script>\n<script src="/site.js"></script>\n<script src="/shell.js" defer></script>\n'
            '<!--OHI:PAGEJS-->' + pagejs + '<!--/OHI:PAGEJS-->\n<script src="/assistant.js" defer></script>\n</body>\n</html>\n')
    open(p, 'w', encoding='utf-8').write(html)
    return p


LEGACY = ['confidentialitate.html', 'termeni.html', 'site-uri-restaurante.html', 'site-uri-saloane.html',
          'site-uri-service-auto.html', 'solutii-personalizate.html', 'constructor.html'] + \
         sorted('blog/' + os.path.basename(f) for f in glob.glob(os.path.join(ROOT, 'blog', '*.html')))

if __name__ == '__main__':
    built = []
    for f in sorted(glob.glob(os.path.join(ROOT, 'tools', 'pages', '*.html'))):
        built.append(build_native(f))
    for f in LEGACY:
        built.append(build_legacy(f))
    for b in built:
        print('built', os.path.relpath(b, ROOT))
