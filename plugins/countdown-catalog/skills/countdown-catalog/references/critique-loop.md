# The critique loop: render, read the pixels, fix

Code review can't see a widow, a muddy button or a card that overflows. Only a rendered page can. Run this loop on the **sample** (at least one pass before showing it) and on the **full page** (3 to 5 passes).

## One pass

### A. Render

Serve the build folder, then screenshot desktop and phone with `scripts/render.js`. It also opens the first card and saves two cards, so the interactions get checked too.

```bash
cd site && python3 -m http.server 4179 &
node /path/to/skill/scripts/render.js http://127.0.0.1:4179/ ./shots 1440x900 desktop
node /path/to/skill/scripts/render.js http://127.0.0.1:4179/ ./shots 390x844 mobile
```

It needs Playwright (`npm i playwright` in any folder, then run `render.js` from there, or set `NODE_PATH`). If Playwright's own browser isn't downloaded, it uses the Google Chrome already installed. It prints `errors`, and **that list must be empty**: a console error or a failed request is the first thing to fix. Font requests from Google Fonts are ignored there, since some sandboxes block them.

### B. Look like a hostile design director

Read every screenshot. Hunt for:
- **Broken interactions:** an opened card whose back overflows or shows below the card, a mark that doesn't appear, a "scroll for more" hint covering text, a button with invisible text.
- **Wrong state:** a closed offer showing "Shop now", the wrong offer marked Live, a countdown at 00:00:00:00 during a live sale, a button pointing at the wrong place.
- **Contrast:** any text you squint at, especially accent text on light pages and text on cover gradients.
- **Type:** a headline breaking mid-word, one lonely word on a line, a subtitle colliding with the headline's descenders.
- **Mobile:** the countdown bar taking more than two rows, cards wider than the screen, horizontal scrolling, tap targets under 44px.
- **Flatness:** a hero with no depth, all covers identical, a section that's just a grey slab.
- **The AI-template smell:** centred everything, purple gradients, generic copy, three identical feature boxes.
- **Conversion leaks:** the main button not visible on the first phone screen, competing buttons, the live offer not obvious.

Write each finding as a specific, fixable note, e.g. "card back 'Remind me' button wraps to two lines at 390px".

### C. Fix every finding, where it belongs

| Finding is about… | Fix it in |
|---|---|
| copy, dates, links, labels | `sale.json` |
| colours, fonts, image grading | `brand.json` (re-run `make_tokens.py`) |
| one page's art direction | `custom.css` (tokens only) |
| the engine itself, on every page | `assets/template.html`; tell the skill owner, and re-test all modes |

Rebuild, re-render, and confirm each fix in the new pixels.

### D. One upgrade

Each pass, add one deliberate improvement that raises the craft: a better hero crop, a texture on the bar, tighter copy, a signature detail in `custom.css`. One, not ten, and never at the cost of a rule.

## When it's done

- **At least 3 passes** on the full page.
- From pass 3 on, stop when the build checks pass, `errors` is empty, and the last pass found only cosmetic nits.
- **Never more than 5 passes.** If a real defect survives pass 5, ship the best version and tell the user exactly what's still imperfect.

## When you can't render here

Some environments can't run Node or a browser. Don't fake the critique. Build to the rules, run the two Python checks (they still work), hand over the files, and tell the user plainly that the visual critique couldn't run here. Suggest they open the page in a browser, or re-run in Claude Code or Cowork for the full loop.
