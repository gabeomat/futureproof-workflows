#!/usr/bin/env python3
"""Map a brand (brand.json) onto Countdown Catalog's colour and type ROLES.

The page never names a brand colour. It names jobs (--bg, --accent, --urgency…).
This script decides which brand colour does which job, derives the missing ones,
and nudges any pair that would be hard to read until it passes WCAG AA.

Usage:  python3 make_tokens.py brand.json            -> prints the TOKENS block + a report
Import: from make_tokens import build_tokens          -> (css, fonts_html, report)
"""
import json, sys

# ---------------------------------------------------------------- colour math
def hex_to_rgb(h):
    h = h.strip().lstrip('#')
    if len(h) == 3: h = ''.join(c * 2 for c in h)
    if len(h) != 6: raise ValueError(f'not a 6-digit hex colour: #{h}')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def rgb_to_hex(rgb):
    return '#' + ''.join(f'{max(0, min(255, round(c))):02x}' for c in rgb)

def lum(h):
    def ch(c):
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = hex_to_rgb(h)
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)

def contrast(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)

def mix(a, b, t):
    """t=0 -> a, t=1 -> b"""
    ra, rb = hex_to_rgb(a), hex_to_rgb(b)
    return rgb_to_hex(tuple(x + (y - x) * t for x, y in zip(ra, rb)))

WHITE, BLACK = '#ffffff', '#000000'

def push_until(color, against, target, toward):
    """Move `color` toward `toward` in small steps until contrast with `against` >= target."""
    if contrast(color, against) >= target: return color, False
    for i in range(1, 101):
        c = mix(color, toward, i / 100)
        if contrast(c, against) >= target: return c, True
    return toward, True

def best_text(on, candidates, target=4.5):
    """Pick the candidate with the highest contrast on `on`; fix it if it still fails."""
    best = max(candidates, key=lambda c: contrast(c, on))
    if contrast(best, on) >= target: return best, False
    toward = BLACK if lum(on) > 0.18 else WHITE
    return push_until(best, on, target, toward)

# ---------------------------------------------------------------- fonts
FALLBACK = {'sans': 'system-ui, -apple-system, "Segoe UI", sans-serif',
            'serif': 'Georgia, "Times New Roman", serif',
            'mono': 'ui-monospace, "SFMono-Regular", Menlo, monospace',
            'display': 'system-ui, sans-serif'}

def font_stack(f, default_kind):
    if not f: return FALLBACK[default_kind]
    if isinstance(f, str): f = {'family': f}
    fam = f.get('family')
    kind = f.get('fallback', default_kind)
    return f'"{fam}", {FALLBACK.get(kind, FALLBACK["sans"])}' if fam else FALLBACK.get(kind, FALLBACK['sans'])

def fonts_html(fonts):
    fams, css_urls = [], []
    for role in ('display', 'accent', 'body', 'label'):
        f = fonts.get(role)
        if isinstance(f, dict):
            if f.get('google') and f['google'] not in fams: fams.append(f['google'])
            if f.get('css_url') and f['css_url'] not in css_urls: css_urls.append(f['css_url'])
    out = []
    if fams:
        out.append('<link rel="preconnect" href="https://fonts.googleapis.com">')
        out.append('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>')
        out.append('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?' + '&'.join('family=' + x for x in fams) + '&display=swap">')
    out += [f'<link rel="stylesheet" href="{u}">' for u in css_urls]
    return '\n'.join(out)

# ---------------------------------------------------------------- the mapping
def build_tokens(brand):
    c = {k: v for k, v in (brand.get('colors') or {}).items() if v}
    mode = brand.get('mode', 'dark')
    report = []
    note = lambda m: report.append(m)

    a, b = c.get('background', '#111111'), c.get('ink', '#f4f1ea')
    dark_c, light_c = (a, b) if lum(a) <= lum(b) else (b, a)
    if mode == 'dark':
        bg, ink = dark_c, light_c
        if lum(bg) > 0.06:
            bg2 = mix(bg, BLACK, 0.55); note(f'background {bg} is too light for a dark page; deepened to {bg2}'); bg = bg2
    else:
        bg, ink = light_c, dark_c
        if lum(bg) < 0.75:
            bg2 = mix(bg, WHITE, 0.6); note(f'background {bg} is too dark for a light page; lightened to {bg2}'); bg = bg2
    away = WHITE if mode == 'dark' else BLACK          # direction that adds contrast against bg

    ink, ch = push_until(ink, bg, 7.0, away)
    if ch: note(f'ink adjusted to {ink} so body text reads easily')
    surface = c.get('surface') or mix(bg, ink, 0.05 if mode == 'dark' else 0.03)
    surface2 = mix(bg, ink, 0.10 if mode == 'dark' else 0.07)
    line = mix(bg, ink, 0.17 if mode == 'dark' else 0.14)
    muted = mix(ink, bg, 0.32)
    muted, _ = push_until(muted, surface2, 4.5, ink)

    accent = c.get('accent', '#e8c547')
    # never repaint the brand accent; if it is faint against the page, give buttons a darker edge instead
    accent_edge = accent
    if contrast(accent, bg) < 3.0:
        accent_edge, _ = push_until(accent, bg, 3.0, away)
        note(f'kept your accent {accent}; it is faint on this background, so buttons and live pills get a {accent_edge} edge to stand out')
    on_accent, _ = best_text(accent, [bg, ink, BLACK, WHITE])
    accent_ink = accent
    if contrast(accent, bg) < 4.5:
        accent_ink, _ = push_until(accent, bg, 4.5, away)
        note(f'accent is used as a button colour only; small accent text uses {accent_ink} so it stays readable')

    urgency = c.get('urgency') or mix(accent, BLACK if mode == 'dark' else BLACK, 0.55)
    if 'urgency' not in c: note(f'no urgency colour given; derived {urgency} from the accent for the countdown bar')
    on_urgency, ch = best_text(urgency, [ink, bg, WHITE, BLACK])

    paper = c.get('paper') or (light_c if mode == 'dark' else dark_c)
    if mode == 'light' and 'paper' not in c: paper = mix(dark_c, BLACK, 0.1) if lum(dark_c) > 0.02 else dark_c
    on_paper, _ = best_text(paper, [dark_c, light_c, BLACK, WHITE], 7.0)
    paper_muted, _ = push_until(mix(on_paper, paper, 0.38), paper, 4.5, on_paper)
    # the card back sits on --paper; urgency is used for the kicker label there
    mark = c.get('mark') or accent
    if contrast(mark, surface) < 3.0:
        for cand in (accent, urgency, ink):
            if contrast(cand, surface) >= 3.0: mark = cand; break
        else: mark, _ = push_until(mark, surface, 3.0, away)
        note(f'mark colour changed to {mark} so the circle/stamp shows on the card')
    on_mark, _ = best_text(mark, [bg, ink, BLACK, WHITE])
    shadow = BLACK if mode == 'dark' else mix(dark_c, BLACK, 0.5)

    fonts = brand.get('fonts') or {}
    st = brand.get('style') or {}
    tok = {
        'bg': bg, 'surface': surface, 'surface-2': surface2, 'line': line,
        'ink': ink, 'ink-muted': muted,
        'accent': accent, 'accent-edge': accent_edge, 'on-accent': on_accent, 'accent-ink': accent_ink,
        'urgency': urgency, 'on-urgency': on_urgency,
        'paper': paper, 'on-paper': on_paper, 'paper-muted': paper_muted,
        'mark': mark, 'on-mark': on_mark, 'shadow': shadow,
    }
    lines = ['.cc{']
    lines.append('  ' + ' '.join(f'--{k}:{v};' for k, v in tok.items()))
    lines.append(f'  --font-display:{font_stack(fonts.get("display"), "sans")}; --font-accent:{font_stack(fonts.get("accent"), "serif")};')
    lines.append(f'  --font-body:{font_stack(fonts.get("body"), "sans")}; --font-label:{font_stack(fonts.get("label") or fonts.get("body"), "sans")};')
    lines.append(f'  --display-weight:{st.get("display_weight", (fonts.get("display") or {}).get("weight", 700) if isinstance(fonts.get("display"), dict) else 700)};'
                 f' --display-tracking:{st.get("display_tracking", "-0.035em")}; --display-case:{st.get("display_case", "none")}; --accent-style:{st.get("accent_style", "normal")};')
    lines.append(f'  --label-tracking:{st.get("label_tracking", "0.18em")};')
    lines.append(f'  --radius-card:{st.get("radius_card", "6px")}; --radius-pill:{st.get("radius_pill", "999px")};')
    lines.append(f'  --img-brightness:{st.get("img_brightness", 0.55 if mode == "dark" else 0.9)}; --img-contrast:{st.get("img_contrast", 1.06)};'
                 f' --img-saturate:{st.get("img_saturate", 0.8)}; --grain:{st.get("grain", 0.07 if mode == "dark" else 0.05)};')
    lines.append('}')
    lines.append(f'body:has(> .cc){{background:{bg}}}')
    css = '\n'.join(lines)

    pairs = [('ink', 'bg', 4.5), ('ink-muted', 'bg', 4.5), ('ink-muted', 'surface-2', 4.5), ('on-accent', 'accent', 4.5),
             ('accent-edge', 'bg', 3.0), ('accent-ink', 'bg', 4.5), ('on-urgency', 'urgency', 4.5), ('on-paper', 'paper', 4.5),
             ('paper-muted', 'paper', 4.5), ('mark', 'surface', 3.0), ('on-mark', 'mark', 4.5)]
    checks = [(f, b2, round(contrast(tok[f], tok[b2]), 2), need) for f, b2, need in pairs]
    return css, fonts_html(fonts), report, tok, checks

if __name__ == '__main__':
    if len(sys.argv) < 2: sys.exit(__doc__)
    brand = json.load(open(sys.argv[1]))
    css, fh, report, tok, checks = build_tokens(brand)
    print(css); print(); print(fh); print()
    for r in report: print('NOTE:', r)
    for f, b2, r, need in checks: print(f'{"PASS" if r >= need else "FAIL"}  {f} on {b2}: {r}:1 (needs {need})')
