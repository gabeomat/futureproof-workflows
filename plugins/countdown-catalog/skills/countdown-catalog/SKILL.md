---
name: countdown-catalog
description: Builds a Countdown Catalog page, a limited-time sale page for two or more offers with a live countdown bar and offer cards visitors can open for details and save to a shortlist. Interviews the user about the sale, maps their brand onto the page, lets them pick a signature interaction and approve a sample section, then builds, critiques and hands off the full page. Run ONLY when the user types /countdown-catalog or asks for "Countdown Catalog" by name. Never use it for a general landing page, sales page or opt-in page request.
disable-model-invocation: true
argument-hint: "[a few words about the sale, optional]"
---

# Countdown Catalog

A Countdown Catalog is a limited-time sale page for **two or more offers**. A countdown bar stays pinned to the top of the page. Each offer is a card that visitors can **open** to read the details and **mark** to save to a shortlist, with an optional calendar reminder for offers that haven't opened yet. One deal a day, a few deals all week, or a mix: the page works out which offers are live, coming or closed, and updates itself while the visitor is on it.

## How this skill is built: three layers

| Layer | What's in it | Where it comes from |
|---|---|---|
| **Pattern** (fixed) | Section order, the countdown logic, the card interactions, motion, accessibility | `assets/template.html`, already built and tested. Never rewrite it per page. |
| **Tokens** (pulled) | Colours, fonts, image treatment, corner radius | The user's brand, written to `brand.json`, mapped by `scripts/make_tokens.py` |
| **Content** (interviewed) | Offers, dates, copy, links, photos, FAQ | The interview, written to `sale.json` |

**The rule that makes it reusable:** no colour or font name is ever typed into the page. The CSS names jobs (`--bg`, `--accent`, `--urgency`…), and `make_tokens.py` fills those jobs from the brand. `scripts/check_tokens.py` fails the build if a colour or font appears anywhere outside the TOKENS block, including in custom CSS you write for a page.

## Before you start

- **Whose page is this? Ask before using any brand or voice.** The person running this may be building a page for a client, not for themselves. Before you read colours, fonts or voice from anywhere, ask: "Is this page for you or for someone else, like a client?" Then, if you find a brand skill, a brand guide, a brand file in a business-brain folder, a voice skill, or an earlier `brand.json`, **name what you found and ask whether it's the right one for this page.** Never apply a brand or a voice just because it's installed or sitting in the folder. For a client's page, take the brand from what the client provides (their website, brand guide, logo files) and the voice from their own copy, and leave the user's own brand and voice skills out of it.
- **Too few offers.** If the user has only **one** offer, tell them this skill is built for two or more, and that a single-offer page is a different page type. Let them choose whether to stop or carry on with one card.
- **The page owner's voice.** Once the user has confirmed whose page it is and which voice skill (if any) belongs to that person, write all page copy through it. Otherwise match the voice from that person's existing copy, and say so.
- **Where to work.** Create one working folder per sale in the user's workspace, e.g. `countdown-catalog/<sale-id>/`, holding `brand.json`, `sale.json`, optional `custom.css`, `assets/` (their images) and `site/` (the build). If a `brand.json` from an earlier sale exists, offer to reuse it, and only reuse it once the user confirms it's the same brand.
- **What this environment can do.** You need Python 3 for the build. For the screenshot critique you also need Node and Playwright (`npm i playwright`); `render.js` falls back to the installed Google Chrome if Playwright's browser isn't downloaded. If you can't render here, say so plainly, and never claim a critique you didn't run (see `references/critique-loop.md`).

## The pipeline (say which step you're on)

```
1. BRAND        whose page? which brand? dark or light?      → brand.json   ★ STOP 1   references/brand-mapping.md
2. INTERVIEW    the sale, offers, timer, story, read the plan back → sale.json   ★ STOP 2   references/interview.md, sale-file.md, timers.md
3. SAMPLER      build --mode sampler, user picks an interaction             ★ STOP 3   references/interactions.md
4. SAMPLE       art direction + build --mode sample, critique, user approves the look   ★ STOP 4   references/art-direction.md
5. FULL PAGE    build --mode full, critique loop (3–5 passes)                          references/critique-loop.md
6. HAND-OFF     page or embed export, publish checklist, ship on their say-so          references/publishing.md
```

**Every ★ STOP ends your turn and waits for the user's answer.** Nothing after a stop gets built until they've answered. A demo, a test, a made-up business, or "just use something nice" does **not** skip a stop. Those are exactly the runs where it's easiest to assume, and assuming is the failure this rule exists for. If the user explicitly says "skip the questions and pick for me", you may choose, but say what you chose at the next stop so they can change it.

### 1. Brand (approval stop 1)
Follow `references/brand-mapping.md`. **Always ask the brand question, for real clients and demos alike:** "Do you have a brand you'd like me to use for this page?" Offer the choices in that file:
- their own brand
- a client's brand
- a reference website to borrow from
- a mood
- two or three looks you draft for them to pick from

Name any brand skill, brand file or earlier `brand.json` you found, and don't use it until they say it's the right one. **Never invent a brand on your own, even for a demo.** In the same message, ask whether the page should be **dark or light**, and suggest one. Wait for both answers. Then pull colours, fonts and logo from the confirmed source and write `brand.json`. Run `python3 scripts/make_tokens.py brand.json` and **pass every NOTE it prints on to the user in plain words**, for example "Your yellow is faint on a light page, so buttons get a darker edge."

### 2. Interview
Follow `references/interview.md`: a few questions at a time, each with a sensible default, explaining any term in one sentence. It covers the sale's shape, the timer (fixed date, per-visitor, or Deadline Funnel; see `references/timers.md`), every offer, the story and the FAQ. Write `sale.json` to the format in `references/sale-file.md`. Write real, final copy (no placeholders, no invented testimonials or numbers).

**Approval stop 2: read the plan back.** Before building anything, show a short summary:
- the brand you'll use and dark or light
- the sale name and dates
- the timer
- each offer with its day, price and link
- the flagship, if there is one
- anything still missing

Wait for their OK or corrections.

### 3. Signature interaction (approval stop 3)
Build the sampler:

```bash
python3 scripts/build_page.py --sale sale.json --brand brand.json --mode sampler --out site-sampler
```

This shows the four tested interactions side by side in **their** colours and fonts, on their real offers. Show it to them (a live preview if you can serve it, otherwise screenshots or the file), and suggest one that fits their brand (see `references/interactions.md`). Write their choice into `sale.json` → `interaction`. **Don't go on until they've picked.**

### 4. Sample section (approval stop 4)
Do the art direction first (`references/art-direction.md`): hero image, offer images or covers, any custom touches in `custom.css` (tokens only). Then build the sample, which is the countdown bar, hero and the first two offer cards with the chosen interaction working:

```bash
python3 scripts/build_page.py --sale sale.json --brand brand.json --mode sample --out site-sample [--custom-css custom.css]
```

Run at least one critique pass on it (render, look, fix) **before** showing it. Then show it and ask for their reaction to colours, fonts, spacing and motion. Change it until they approve. **Don't build the full page until they say the look is right.**

### 5. Full page
```bash
python3 scripts/build_page.py --sale sale.json --brand brand.json --mode full --out site [--custom-css custom.css]
```
The build must end with every check passing (exit code 0). Then run the critique loop in `references/critique-loop.md`: render desktop and mobile, open a card, save two cards, read the screenshots like a hostile design director, fix, repeat. Minimum 3 passes, maximum 5.

### 6. Hand-off
Follow `references/publishing.md`. Ask where the page will live, build the right export (`--target page` or `--target embed`), give them the publish checklist, and deploy only when they say so.

## Hard rules

- **Never edit `assets/template.html` for one user's page.** Per-page changes go in `sale.json`, `brand.json` or `custom.css`. If you find an engine bug, fix it in the template, note it for the skill owner, and re-run all three modes.
- **No colour or font outside the TOKENS block.** `check_tokens.py` enforces this, including for `custom.css`.
- **Contrast is checked, not assumed.** `check_contrast.py` must pass. If a brand colour fails, `make_tokens.py` adjusts the job it plays, never the brand itself where avoidable, and you tell the user.
- **Nothing invented.** No made-up testimonials, customer counts, logos or people. Use the user's real photos or clearly art-directed imagery.
- **The timer and the offers come from `sale.json`.** Don't hard-code dates into copy that the page already shows (the bar, pills and schedule are generated from the dates).
- **Ship only on the user's say-so.**

## Files

- `assets/template.html`: the engine (pattern + interactions + countdown). Brand-free.
- `scripts/make_tokens.py`: brand → colour and type roles, with contrast fixes and notes.
- `scripts/build_page.py`: template + brand + sale (+ custom CSS) → `site/index.html` (and `embed.html`), then runs both checks.
- `scripts/check_tokens.py`, `scripts/check_contrast.py`: the two gates.
- `scripts/render.js`: screenshots for the critique loop, including an opened card and saved cards.
- `examples/sale.example.json`, `examples/brand.example.json`: a fictional studio to learn the format from. Never reuse its copy or treat it as the user's data.
