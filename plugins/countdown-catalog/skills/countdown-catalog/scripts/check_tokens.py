#!/usr/bin/env python3
"""Fail if any brand value (colour or font name) is hard-coded outside the TOKENS / FONTS blocks.

Usage: python3 check_tokens.py page.html      exit 0 = clean, 1 = problems found
"""
import re, sys

COLOR_PROPS = r'(?:color|background(?:-color)?|border(?:-[a-z]+)*|outline(?:-color)?|fill|stroke|box-shadow|text-shadow|text-decoration-color|caret-color|accent-color|column-rule-color)'
NAMED = r'(?:white|black|red|green|blue|yellow|orange|purple|pink|gray|grey|gold|silver|navy|maroon|teal|olive|lime|aqua|fuchsia|beige|ivory|crimson|coral|salmon|tan|brown|cream)'

def strip(html):
    html = re.sub(r'/\* TOKENS:START \*/.*?/\* TOKENS:END \*/', '', html, flags=re.S)
    html = re.sub(r'<!-- FONTS:START -->.*?<!-- FONTS:END -->', '', html, flags=re.S)
    html = re.sub(r'<!-- HEAD:START -->.*?<!-- HEAD:END -->', '', html, flags=re.S)
    html = re.sub(r'<script type="application/(?:ld\+)?json"[^>]*>.*?</script>', '', html, flags=re.S)
    return html

def check(html):
    body = strip(html)
    problems = []
    for n, line in enumerate(body.splitlines(), 1):
        if 'mask' in line:                      # black/transparent in masks are alpha, not brand colour
            line = re.sub(r'(?:-webkit-)?mask(?:-image)?:[^;}]*', '', line)
        for m in re.finditer(r'#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z_-])', line):
            problems.append((n, f'hex colour {m.group(0)}'))
        for m in re.finditer(r'\b(?:rgba?|hsla?|oklch|lab|lch)\(', line):
            problems.append((n, f'colour function {m.group(0)}…'))
        for m in re.finditer(COLOR_PROPS + r'\s*:\s*[^;}]*\b' + NAMED + r'\b', line):
            problems.append((n, f'named colour in "{m.group(0)[:60]}"'))
        for m in re.finditer(r'font(?:-family)?\s*:\s*([^;}"]*)', line):
            v = m.group(1).strip()
            if v and 'var(' not in v and v not in ('inherit', 'initial', 'unset') and not re.match(r'^[\d.]+(?:px|rem|em)?$', v):
                problems.append((n, f'font set without a token: "{m.group(0)[:60]}"'))
    return problems

if __name__ == '__main__':
    if len(sys.argv) < 2: sys.exit(__doc__)
    probs = check(open(sys.argv[1], encoding='utf-8').read())
    if not probs:
        print('PASS  no hard-coded colours or fonts outside the TOKENS block'); sys.exit(0)
    for n, p in probs: print(f'FAIL  line {n} (after stripping token blocks): {p}')
    sys.exit(1)
