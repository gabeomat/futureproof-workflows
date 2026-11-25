# Signature interactions

Every Countdown Catalog card does two things: it **opens** to show the details (the reveal) and it gets **marked** when the visitor saves it (the mark). The pairing of reveal and mark is the page's signature. Four pairings are built and tested in the engine.

| Preset | Reveal | Mark | Card skin | Fits |
|---|---|---|---|---|
| `turn-circle` | **Turn over**: the card flips in 3D to a paper back | A hand-drawn ink **circle** around the tagline | plain | Editorial, fashion, lifestyle, "catalog" brands; the classic |
| `ticket-stamp` | **Tear it open**: the front peels away like a ticket stub | A rubber **stamp** thumps onto the card | ticket (side notches + perforation) | Events, workshops, conferences, playful brands, travel |
| `sheet-highlight` | **See details**: a sheet slides up over the card | A **marker** swipes behind the tagline | plain | Clean, professional, B2B, coaching, education |
| `gift-tag` | **Open it**: the front lifts off like a box lid | A gift **tag** swings in on a string | gift (ribbon stripe) | Holiday, Black Friday, gifting, celebration sales |

All four share the same accessibility and motion rules: real buttons and checkboxes, Escape closes an open card, focus moves into and out of the opened card, the back is hidden from screen readers while closed, and every animation turns off under reduced motion.

## The sampler (approval stop 3)

`--mode sampler` builds one page showing all four, each on one of their real offers, in their brand. Ask them to click each card's button to open it and tick each box. Then:

1. **Suggest one** from the "Fits" column for their brand and sale, with one sentence of reasoning.
2. Let them pick. They can also mix: a reveal from one and a mark from another.
3. Write it to `sale.json`:

```json
"interaction": { "preset": "ticket-stamp" }
```

or a mix, with custom button words:

```json
"interaction": { "reveal": "flip", "mark": "stamp", "skin": "plain",
                 "reveal_word": "Turn over", "back_word": "Turn back", "mark_word": "Saved" }
```

`reveal`: `flip` | `peel` | `slide` | `lift`. `mark`: `circle` | `stamp` | `highlight` | `tag`. `skin`: `plain` | `ticket` | `gift`.

4. Match the interface words to the mark in `labels`, for example with a circle: `"picks_title": "Your circled deals"`, `"mark": "Circle {name}"`.

## Adding a new interaction (skill owner only)

New reveals and marks go into `assets/template.html` as new `data-reveal` / `data-mark` CSS blocks plus a `PAIRS` entry, never into one user's page. Each one needs:
- a reduced-motion version
- correct focus and `inert` behaviour
- a test on desktop and on a phone-width screen
- a render of all three modes

Animate only `transform`, `opacity`, `rotate`, `translate`, SVG stroke and background-size, so motion stays smooth on phones.
