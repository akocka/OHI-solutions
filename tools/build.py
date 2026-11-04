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
         '<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800&family=Caveat:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">')

# ---- the one menu ---------------------------------------------------------
# (url, label, short line shown in the phone menu). Until a page is rebuilt, vercel.json
# sends its url to the matching part of the homepage, so no menu item ever leads to a 404.
NAV = [('/servicii', 'Servicii', 'Ce facem pentru afacerea ta'),
       ('/preturi', 'Prețuri și abonamente', 'Plată unică, de la 500 lei'),
       ('/despre', 'Despre noi', 'Cine îți face site-ul'),
       ('/portofoliu', 'Portofoliu', 'Lucrări reale'),
       ('/personalizate', 'Personalizate', 'Funcții făcute pe măsură'),
       ('/ajutor', 'Ajutor', 'Întrebări și răspunsuri')]
MNAV = NAV

LOGO = ('<svg viewBox="0 18 359 170" role="img" aria-hidden="true"><rect x="24" y="46" width="112" height="112" rx="30" fill="none" stroke="#7C5CFF" stroke-width="26" transform="rotate(-10 80 102)"/>'
        '<path d="M233.9 160V61h21.45v99ZM168.95 160V61h21.6v99ZM181.7 118.75v-17.7h60.75v17.7ZM277.4 160V61h22.05v99Z" fill="currentColor"/><circle cx="332.4" cy="150" r="13" fill="#FF6B1A"/></svg>')


def section_of(path):
    """Which menu item is 'current' for a page path."""
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
            f'<a class="o-btn o-a" href="/#oferta"><span class="o-l">Cere demo gratuit</span><span class="o-s">Demo gratuit</span></a>'
            f'<button class="o-burger" id="oburger" type="button" aria-label="Meniu" aria-expanded="false" aria-controls="omnav"><i></i><i></i></button></div>\n'
            f'  <span class="o-prog" id="oprog" aria-hidden="true"></span>\n'
            f'</div></div>\n'
            f'<div class="o-mnav" id="omnav" role="navigation" aria-label="Meniu mobil">\n  {mnav}\n'
            f'  <div class="o-mfoot"><a class="o-btn o-a" href="/#oferta">Cere demo gratuit</a><a class="o-btn o-g" href="tel:+40740267706">Sună: 0740 267 706</a></div>\n'
            f'</div>')


MARK = '<svg viewBox="0 18 160 170" aria-hidden="true"><rect x="24" y="46" width="112" height="112" rx="30" fill="none" stroke="currentColor" stroke-width="24" transform="rotate(-10 80 102)"/></svg>'
FOOTER = ('<div class="o-ft" role="contentinfo">\n'
          '<div class="o-ftw">\n'
          '  <div class="o-ftl">\n'
          '    <div class="o-ftbg" aria-hidden="true"><i></i><i></i><i></i></div>\n'
          '    <a class="o-ftlogo" href="/" aria-label="OHI Solutions"><span class="o-ftmark">O</span><span class="o-ftname">OHI Solutions</span></a>\n'
          '    <p class="o-fttag">Site-uri care aduc clienți,<br><span>făcute în Târgu Mureș.</span></p>\n'
          '    <div class="o-ftsoc"><span class="o-hand">Hai să vorbim!</span><div class="o-ftic">'
          '<a href="https://wa.me/40740267706" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 18.8Z"/><path d="M9.2 9.3c.3 2.4 2.1 4.3 4.6 4.9l1-1.1 1.7.8-.4 1.6c-3.6.2-7-3-7.1-6.6l1.6-.5.8 1.7Z" class="f"/></svg></a>'
          '<a href="tel:+40740267706" aria-label="Sună-ne"><svg viewBox="0 0 24 24"><path d="M6.6 3.5 9 3l1.6 4.2-2 1.4a10.5 10.5 0 0 0 6.8 6.8l1.4-2L21 15l-.5 2.4c-.2 1.1-1.2 1.8-2.3 1.7C10.6 18.5 5.5 13.4 4.9 5.8c-.1-1.1.6-2.1 1.7-2.3Z"/></svg></a>'
          '<a href="/#oferta" aria-label="Cere demo gratuit"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg></a>'
          '</div></div>\n'
          '  </div>\n'
          '  <div class="o-ftr">\n'
          f'    <div class="o-ftlucky" aria-hidden="true"><div class="o-cube"><b>O</b></div><div class="o-luckrow"><svg class="o-arr" viewBox="0 0 24 24"><path d="M3 20C6 14 10 9 18 5"/><path d="M18 5h-6"/><path d="M18 5v6"/></svg><span class="o-hand">Ai o idee?</span></div></div>\n'
          '    <div class="o-ftcols">\n'
          '      <div><p class="o-hand o-ct">Pe pagină</p><a href="/#despre">Despre noi</a><a href="/#lucrari">Lucrări</a><a href="/#preturi">Prețuri</a><a href="/#oferta">Cere demo gratuit</a></div>\n'
          '      <div><p class="o-hand o-ct">Contact</p><a href="tel:+40740267706">0740 267 706</a><a href="https://wa.me/40740267706" target="_blank" rel="noopener">WhatsApp</a><span class="o-ftplace">Târgu Mureș</span></div>\n'
                    '    </div>\n'
          '    <div class="o-ftbot">\n'
          '      <div class="o-ftcopy"><span>© 2026 OHI Solutions · Târgu Mureș</span><span>Site în reconstrucție</span></div>\n'
          '      <div class="o-ftcta"><h4 style="font-weight:400">Ai o afacere în Mureș?<strong>Hai să-i facem site-ul.</strong></h4>\n'
          '        <form class="o-ftform" action="/#oferta" method="get"><label class="o-vh" for="oFtTel">Numărul tău de telefon</label><input id="oFtTel" name="tel" type="tel" inputmode="tel" autocomplete="tel" placeholder="Numărul tău de telefon" required><button type="submit">Sună-mă</button></form>\n'
          '      </div>\n'
          '    </div>\n'
          '  </div>\n'
          '</div>\n'
          '<div class="o-ftwm" aria-hidden="true"><svg id="oWm" viewBox="62 95 876 175" preserveAspectRatio="xMidYMid meet"><text id="oWmT" x="500" y="240" text-anchor="middle" font-size="320">OHI Solutions</text></svg></div>\n'
          '</div>')

COMMON_HEAD = ('<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n')
ICONS = ('<meta name="theme-color" content="#0A0714">\n<link rel="icon" href="/favicon.ico" sizes="any">\n'
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
    # shared blocks: <!--INCLUDE name--> pulls tools/parts/name.html
    main = re.sub(r'<!--INCLUDE ([\w-]+)-->', lambda m: open(os.path.join(ROOT, 'tools', 'parts', m.group(1) + '.html'), encoding='utf-8').read().strip(), main)
    path = meta['path']
    js = ''.join(f'<script src="{j}" defer></script>\n' for j in meta.get('js', []))
    js += ''.join(f'<script type="module" src="{j}"></script>\n' for j in meta.get('module', []))
    css = ''.join(f'<link rel="stylesheet" href="{c}">\n' for c in meta.get('css', []))
    bc = f' class="{meta["bodycls"]}"' if meta.get('bodycls') else ''
    html = ('<!DOCTYPE html>\n<html lang="ro">\n<head>\n' + COMMON_HEAD + native_meta(meta) + '\n' + ICONS + '\n' + FONTS + '\n'
            '<link rel="stylesheet" href="/shell.css">\n<link rel="stylesheet" href="/ohi.css">\n' + css + '</head>\n'
            '<body data-ohi="new"' + bc + '>' + f'\n{header(path)}\n{main}\n{FOOTER}\n'
            '<script src="/shell.js" defer></script>\n<script src="/ohi.js" defer></script>\n' + js +
            '<script src="/assistant.js" defer></script>\n</body>\n</html>\n')
    name = 'index' if path == '/' else path.strip('/')
    out = os.path.join(ROOT, name + '.html')
    os.makedirs(os.path.dirname(out), exist_ok=True)
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


LEGACY = []

if __name__ == '__main__':
    built = []
    for f in sorted(glob.glob(os.path.join(ROOT, 'tools', 'pages', '*.html'))):
        built.append(build_native(f))
    for f in LEGACY:
        built.append(build_legacy(f))
    for b in built:
        print('built', os.path.relpath(b, ROOT))
