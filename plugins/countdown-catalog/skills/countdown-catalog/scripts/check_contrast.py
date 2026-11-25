#!/usr/bin/env python3
"""Read the TOKENS block of a built page and check every text/UI colour pair against WCAG AA.

Usage: python3 check_contrast.py page.html      exit 0 = all pass, 1 = a pair fails
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_tokens import contrast

PAIRS = [('ink', 'bg', 4.5, 'body text'), ('ink-muted', 'bg', 4.5, 'secondary text'),
         ('ink-muted', 'surface-2', 4.5, 'secondary text on cards'), ('on-accent', 'accent', 4.5, 'button text'),
         ('accent-edge', 'bg', 3.0, 'buttons and live pills stand out'), ('accent-ink', 'bg', 4.5, 'small accent text'),
         ('on-urgency', 'urgency', 4.5, 'countdown bar text'), ('on-paper', 'paper', 4.5, 'card back text'),
         ('paper-muted', 'paper', 4.5, 'card back secondary text'), ('mark', 'surface', 3.0, 'save mark visible on the card'),
         ('on-mark', 'mark', 4.5, 'tag text')]

def tokens(html):
    m = re.search(r'/\* TOKENS:START \*/(.*?)/\* TOKENS:END \*/', html, re.S)
    if not m: return {}
    return dict(re.findall(r'--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\b', m.group(1)))

def check(html):
    t = tokens(html)
    out = []
    for f, b, need, what in PAIRS:
        if f not in t or b not in t:
            out.append((False, f'{f} on {b}: token missing or not a 6-digit hex'))
            continue
        r = contrast(t[f], t[b])
        out.append((r >= need, f'{f} on {b} ({what}): {r:.2f}:1, needs {need}'))
    return out

if __name__ == '__main__':
    if len(sys.argv) < 2: sys.exit(__doc__)
    res = check(open(sys.argv[1], encoding='utf-8').read())
    for ok, msg in res: print(('PASS  ' if ok else 'FAIL  ') + msg)
    sys.exit(0 if all(ok for ok, _ in res) else 1)
