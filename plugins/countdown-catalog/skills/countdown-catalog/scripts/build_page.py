#!/usr/bin/env python3
"""Assemble a Countdown Catalog page from the engine template + brand.json + sale.json, then run the checks.

Usage:
  python3 build_page.py --sale sale.json --brand brand.json --out ./site
         [--mode sampler|sample|full]   which view to build (default: full)
         [--target page|embed]          page = full HTML file; embed = also write embed.html for a site builder's code block
         [--custom-css extra.css]       art-directed extras for THIS page (tokens only, checked like everything else)

Writes <out>/index.html (and <out>/embed.html for --target embed). Exit 1 if a check fails.
"""
import argparse, html as H, json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from make_tokens import build_tokens
import check_tokens, check_contrast

def block(s, start, end, new):
    pat = re.escape(start) + r'.*?' + re.escape(end)
    if not re.search(pat, s, re.S): raise SystemExit(f'template is missing the {start} marker')
    return re.sub(pat, lambda m: f'{start}\n{new}\n{end}', s, count=1, flags=re.S)

def jsonld(sale, page_url):
    graph = [{'@type': 'WebPage', 'name': sale.get('seo', {}).get('title') or sale.get('name'),
              'description': sale.get('seo', {}).get('description', ''), **({'url': page_url} if page_url else {})}]
    offers = []
    for o in sale.get('offers', []):
        item = {'@type': 'Offer', 'name': o.get('name'), 'description': o.get('tagline', '')}
        if o.get('link'): item['url'] = o['link']
        num = re.sub(r'[^\d.]', '', o.get('price', '') or '')
        if num: item['price'] = num; item['priceCurrency'] = sale.get('currency', 'USD')
        if sale.get('timer', {}).get('mode', 'fixed') == 'fixed':
            if o.get('opens') or sale.get('start'): item['availabilityStarts'] = o.get('opens') or sale.get('start')
            if o.get('closes') or sale.get('end'): item['availabilityEnds'] = o.get('closes') or sale.get('end')
        offers.append(item)
    if offers: graph.append({'@type': 'ItemList', 'name': sale.get('name'), 'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'item': x} for i, x in enumerate(offers)]})
    faq = (sale.get('faq') or {}).get('items') or []
    if faq: graph.append({'@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q['q'], 'acceptedAnswer': {'@type': 'Answer', 'text': q['a']}} for q in faq]})
    return '<script type="application/ld+json">' + json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False).replace('</', '<\\/') + '</script>'

def head(sale):
    seo = sale.get('seo') or {}
    title = seo.get('title') or sale.get('name') or 'Sale'
    desc = seo.get('description', '')
    img = seo.get('image') or (sale.get('hero') or {}).get('image', '')
    out = [f'<title>{H.escape(title)}</title>']
    out.append(f'<link rel="icon" href="{H.escape(seo.get("favicon") or "data:,")}">')
    if desc: out += [f'<meta name="description" content="{H.escape(desc)}">', f'<meta property="og:description" content="{H.escape(desc)}">']
    out.append(f'<meta property="og:title" content="{H.escape(title)}">')
    if img and re.match(r'https?:', img): out.append(f'<meta property="og:image" content="{H.escape(img)}">')
    hi = (sale.get('hero') or {}).get('image')
    if hi: out.append(f'<link rel="preload" as="image" href="{H.escape(hi)}">')
    out.append(jsonld(sale, seo.get('url', '')))
    extra = (sale.get('timer') or {}).get('head_html')
    if extra: out.append(extra)          # e.g. the Deadline Funnel tracking snippet the user pasted
    return '\n'.join(out)

def lint_sale(sale, mode):
    warn = []
    if not sale.get('offers'): warn.append('no offers in the sale file')
    t = (sale.get('timer') or {}).get('mode', 'fixed')
    if t == 'fixed':
        for k in ('start', 'end'):
            if not sale.get(k): warn.append(f'fixed timer needs sale "{k}" (ISO date with offset, e.g. 2026-11-23T06:00:00-05:00)')
    for o in sale.get('offers', []):
        for k in ('name', 'tagline'):
            if not o.get(k): warn.append(f'offer {o.get("id", "?")} has no {k}')
        if not o.get('link') and mode == 'full': warn.append(f'offer {o.get("name", o.get("id"))} has no checkout link')
    blob = json.dumps(sale).lower()
    for bad in ('lorem', 'todo', 'tbd', '[insert', 'placeholder'):
        if bad in blob: warn.append(f'placeholder text found: "{bad}"')
    return warn

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--sale', required=True); ap.add_argument('--brand', required=True); ap.add_argument('--out', required=True)
    ap.add_argument('--mode', default='full', choices=['sampler', 'sample', 'full'])
    ap.add_argument('--target', default='page', choices=['page', 'embed'])
    ap.add_argument('--custom-css'); ap.add_argument('--template', default=os.path.join(HERE, '..', 'assets', 'template.html'))
    a = ap.parse_args()

    sale = json.load(open(a.sale, encoding='utf-8')); brand = json.load(open(a.brand, encoding='utf-8'))
    sale.setdefault('brand_name', brand.get('brand_name', ''))
    if brand.get('interaction') and not sale.get('interaction'): sale['interaction'] = brand['interaction']
    css, fonts, notes, tok, pairs = build_tokens(brand)

    s = open(a.template, encoding='utf-8').read()
    s = block(s, '/* TOKENS:START */', '/* TOKENS:END */', css)
    s = block(s, '<!-- FONTS:START -->', '<!-- FONTS:END -->', fonts)
    s = block(s, '<!-- HEAD:START -->', '<!-- HEAD:END -->', head(sale))
    if a.custom_css: s = block(s, '/* CUSTOM:START */', '/* CUSTOM:END */', open(a.custom_css, encoding='utf-8').read())
    data = json.dumps(sale, ensure_ascii=False, indent=1).replace('</', '<\\/')
    s = re.sub(r'(<script type="application/json" id="cc-sale">).*?(</script>)', lambda m: m.group(1) + data + m.group(2), s, count=1, flags=re.S)
    s = s.replace('<div class="cc" id="cc" data-mode="full">', f'<div class="cc" id="cc" data-mode="{a.mode}">', 1)
    lang = sale.get('lang') or (sale.get('locale') or 'en').split('-')[0]
    s = s.replace('<html lang="en">', f'<html lang="{H.escape(lang)}">', 1)

    os.makedirs(a.out, exist_ok=True)
    page = os.path.join(a.out, 'index.html')
    open(page, 'w', encoding='utf-8').write(s)
    written = [page]
    if a.target == 'embed':
        style = re.search(r'<style>.*?</style>', s, re.S).group(0)
        body = re.search(r'<body>(.*)</body>', s, re.S).group(1)
        hd = re.search(r'<!-- HEAD:START -->(.*?)<!-- HEAD:END -->', s, re.S).group(1)
        ld = '\n'.join(re.findall(r'<script type="application/ld\+json">.*?</script>', hd, re.S))
        emb = f'<!-- Countdown Catalog: paste this whole block into one custom-code element -->\n{fonts}\n{style}\n{body.strip()}\n{ld}\n'
        open(os.path.join(a.out, 'embed.html'), 'w', encoding='utf-8').write(emb)
        written.append(os.path.join(a.out, 'embed.html'))

    ok = True
    print('Built:', ', '.join(written))
    for n in notes: print('NOTE ', n)
    for w in lint_sale(sale, a.mode): print('WARN ', w)
    probs = check_tokens.check(s)
    if probs:
        ok = False
        for n, p in probs: print('FAIL  hard-coded brand value:', p)
    else: print('PASS  no hard-coded colours or fonts outside the TOKENS block')
    for good, msg in check_contrast.check(s):
        ok &= good; print(('PASS  ' if good else 'FAIL  ') + msg)
    sys.exit(0 if ok else 1)

if __name__ == '__main__':
    main()
