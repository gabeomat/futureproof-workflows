# Brand mapping: brand.json → the page's colour and type roles

The page never uses a brand colour directly. It uses **roles**, and `scripts/make_tokens.py` decides which brand colour plays each role, derives the rest, and fixes any pair that would be hard to read.

## 1. Confirm whose brand, then pull it

**Ask first, before using anything you find.** The person running the skill may be an agency, a designer or a coach building this page for a client. A brand skill or brand file in their environment is probably *their* brand, not necessarily this page's.

1. Ask: "Is this page for you, or for someone else, like a client?" and **always** ask: "Do you have a brand you'd like me to use for this page?" Ask both even when the business is a demo or made up. Offer these choices:
   - **Your own brand**, from your brand skill or brand guide
   - **A client's brand**, from their website, brand guide or logo files
   - **A reference:** a website whose look to borrow (keep the business name as given)
   - **A mood:** "cozy and rustic", "bright and modern", "dark and luxe for the holidays"
   - **Options:** you draft two or three looks (palette + font pairing, shown as swatches or a small sampler) and they pick one

   Never pick colours and fonts yourself without asking, demo or not.
2. Look for brand sources, then **name each one you found and ask which to use**, for example: "I found a brand skill called `my-brand` and a brand guide in your business-brain folder. Should this page use one of those, or is it for a different brand?" Sources to look for:
   - installed brand skills
   - brand guides or brand files in the workspace or a business-brain folder
   - an earlier `brand.json`
   - the website they name
3. Use only the source they confirm.
   - **Their own page:** usually their brand skill or brand guide.
   - **A client's page:** the client's website, brand guide or logo files. If the client has nothing written down, pull the values from the client's website CSS, or ask the user for them.
4. From the confirmed source, take what you can, and ask only for what's still missing. Use the exact values; never estimate a hex code from a screenshot when the real value exists somewhere.

The same rule applies to **voice**: a voice skill in the environment belongs to whoever installed it. For a client's page, write in the client's voice from their own copy, unless the user says otherwise.

## 2. Dark or light?

Ask, with a suggestion:
- **Dark** suits evening, luxury, events, holiday and "drop" sales, and brands with rich accent colours. A light-background brand still works: its dark colour becomes the page and its light colour becomes the text.
- **Light** suits clean, editorial, wellness and professional brands, and daytime sales.

## 3. Write brand.json

```jsonc
{
  "brand_name": "Studio Name",
  "mode": "dark",
  "colors": {
    "background": "#f3ede2",   // their main background colour (light or dark, either is fine)
    "ink": "#17150f",          // their main text colour
    "accent": "#e9b44c",       // the ONE action colour: buttons, live pills, glow
    "urgency": "#24412f",      // optional: the countdown bar and covers (a deep secondary colour works best)
    "paper": "#f3ede2",        // optional: the back of an opened card (defaults to the opposite of the page)
    "mark": "#e9b44c",         // optional: the circle / stamp / highlight / tag colour (defaults to accent)
    "surface": "#1c1a16"       // optional: card colour (defaults to a step off the page colour)
  },
  "fonts": {
    "display": { "family": "Bricolage Grotesque", "google": "Bricolage+Grotesque:opsz,wght@12..96,800", "fallback": "sans", "weight": 800 },
    "accent":  { "family": "Fraunces", "google": "Fraunces:ital,opsz,wght@1,9..144,400", "fallback": "serif" },
    "body":    { "family": "Inter", "google": "Inter:wght@400;500;600;700", "fallback": "sans" },
    "label":   { "family": "Inter", "fallback": "sans" }
  },
  "style": {
    "display_case": "none",        // or "uppercase"
    "display_tracking": "-0.035em",
    "accent_style": "italic",      // if the accent font should be italic
    "radius_card": "6px",          // 0px for sharp, 16px for soft
    "img_brightness": 0.55, "img_contrast": 1.06, "img_saturate": 0.8,   // how hero/closing photos are graded
    "grain": 0.07                  // film grain strength, 0 to turn off
  }
}
```

**Fonts:** `google` is the family string from fonts.google.com (the part after `family=`). For self-hosted or Adobe fonts, use `"css_url": "https://…/fonts.css"` instead. Four roles:
- **display**: big headings and numbers
- **accent**: subtitles and the turn in headings, often a serif or italic
- **body**: paragraphs
- **label**: small caps labels and buttons

Two families is normal; one is fine.

## 4. Run it and relay the notes

```bash
python3 scripts/make_tokens.py brand.json
```

It prints the TOKENS block, the font links, every adjustment it made (`NOTE`), and a PASS/FAIL contrast table. Tell the user about each NOTE in plain words. For example:
- "Your yellow is faint on a white page, so buttons get a slightly darker edge. The yellow itself stays."
- "Small text in your accent colour uses a deeper shade so it's readable."
- "I deepened your background a little so the page reads as dark."

## The roles (for reference)

| Role | Used for | Must pass |
|---|---|---|
| `--bg` / `--ink` | page / body text | 4.5:1 |
| `--surface`, `--surface-2`, `--line` | cards, wells, hairlines | (derived) |
| `--ink-muted` | secondary text | 4.5:1 on bg and cards |
| `--accent` / `--on-accent` | buttons, live pills / their text | 4.5:1 |
| `--accent-edge` | button and pill edge when the accent is faint | 3:1 on bg |
| `--accent-ink` | small accent-coloured text | 4.5:1 on bg |
| `--urgency` / `--on-urgency` | countdown bar, flagship tab, covers | 4.5:1 |
| `--paper` / `--on-paper` / `--paper-muted` | opened card back | 4.5:1 |
| `--mark` / `--on-mark` | circle, stamp, highlight, tag | 3:1 on cards / 4.5:1 |
| `--shadow` | shadows | (derived) |

The brand accent is never repainted to pass contrast. The script adds `--accent-edge` and `--accent-ink` instead, so the brand colour stays exactly as given.
