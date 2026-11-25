# sale.json format

Everything the page says lives here. The engine reads it at load time and works out every state (before, live, closed, after) from the dates. Fields marked * are required. See `examples/sale.example.json` for a complete file.

```jsonc
{
  "id": "spring-week-2027",            // * short slug; keys the visitor's saved picks and per-visitor timer
  "name": "Spring Week 2027",          // * used for the page title and structured data
  "brand_name": "Studio Name",         // footer and monogram; build_page fills it from brand.json if missing
  "locale": "en-US",                   // date and weekday words
  "timezone": "America/New_York",      // the zone weekday names are shown in (the countdown itself is exact everywhere)
  "currency": "USD",

  "timer": { "mode": "fixed" },        // * fixed | evergreen | deadline-funnel  → timers.md
  "start": "2027-03-01T06:00:00-05:00",// * for fixed timers: ISO date WITH offset
  "end":   "2027-03-06T00:00:00-05:00",// *

  "interaction": { "preset": "turn-circle" },   // set after the sampler → interactions.md

  "seo": { "title": "…", "description": "…", "image": "https://…/share.jpg", "url": "https://…", "favicon": "https://…/icon.png" },

  "bar": {                             // countdown bar words per phase; long for desktop, short for phones
    "before": { "long": "Spring Week opens in", "short": "Opens in" },
    "live":   { "long": "Spring Week is on. Today's deal closes in", "short": "Today's deal closes in" },
    "after":  { "long": "Spring Week has closed. Thank you.", "short": "The sale has closed" },
    "target": "current-offer"          // current-offer (default: counts to the live offer's close) | sale (counts to the sale end)
  },
  "cta":    { "single": "Shop today's deal", "many": "See the deals", "short": "Shop" },
  "before": { "link": "https://…/early-list", "cta": "Join the early list", "cta_short": "Join", "card_cta": "Remind me" },
  "after":  { "link": "https://…/shop", "cta": "See all courses", "cta_short": "See more" },

  "hero": { "eyebrow": "5 days of deals · March 1 to 5", "title": "Spring Week", "subtitle": "One deal a day",
            "hint": "Turn a card over for the details, and tick the ones you want.", "image": "assets/hero.webp" },

  "labels": { },                       // override any interface word (see list below)

  "offers": [                          // * 2 or more in the main catalog
    {
      "id": "course-a",                // * unique slug
      "name": "Course A",              // *
      "tagline": "First time ever, 50% off",   // * the line on the card front (gets circled/highlighted)
      "group": "catalog",              // catalog (default) | rack (the smaller "shelf" row, open all sale)
      "opens": "2027-03-01T06:00:00-05:00",    // fixed timer; defaults to sale start
      "closes": "2027-03-02T06:00:00-05:00",   // fixed timer; defaults to sale end
      "opens_after_hours": 0,          // evergreen timer only
      "closes_after_hours": 72,        // evergreen timer only; defaults to timer.hours
      "flagship": false,               // true = gold edge + label
      "flagship_label": "The flagship",
      "kicker": "No. 1 · Monday, Mar 1",// small line on the card back
      "description": "…", "best_for": "…", "inside": ["…", "…"],
      "price": "$97", "was": "$197",
      "link": "https://…/checkout",    // * for a published page
      "cta": "Get it now",             // card-back button when live
      "buy_label": "Shop now",         // small link on the card front when live
      "image": "assets/course-a.webp", "image_alt": "…",   // optional; 3:4 portrait works best
      "cover_title": "Course A", "cover_line": "masterclass",   // used when there's no image
      "day_label": "Monday, March 1"   // optional override for the schedule list
    }
  ],

  "rack":    { "eyebrow": "All week long", "title": "On the shelf", "text": "…" },
  "how":     { "eyebrow": "How it works", "title": "One deal a day", "title_turn": "for five days.", "text": "…" },   // fixed timers only
  "note":    { "eyebrow": "A note from …", "title": "…", "title_turn": "…", "body": ["…", "…"], "sign": "…",
               "photo": "assets/me.webp", "photo_alt": "…", "badge": "A note from …", "monogram": "S" },
  "strip":   ["assets/mood-1.webp", "assets/mood-2.webp", "assets/mood-3.webp"],
  "faq":     { "eyebrow": "Questions", "title": "…", "items": [ { "q": "…", "a": "…" } ] },
  "closing": { "eyebrow": "…", "title": "…", "title_turn": "…", "text": "…", "facts": ["…", "…"], "image": "assets/close.webp" },
  "footer":  { "line": "…", "links": [ { "label": "Privacy", "href": "…" }, { "label": "Terms", "href": "…" } ] }
}
```

**`title_turn`**: the second half of a heading, set in the accent typeface and a softer colour ("One deal a day *for five days.*"). Use it on one or two headings, not every one.

**Sections appear only when their data exists.** Leave out `note`, `strip`, `faq`, `closing` or `rack` and that section disappears. `how` only shows for fixed timers.

## Interface words you can override in `labels`

`live`, `closed`, `soon`, `opens` ("Opens {day}"), `reveal`, `back`, `buy`, `go_live`, `go_remind`, `go_closed`, `more`, `mark` ("Save {name}", the screen-reader label), `mark_word` (the stamp/tag word), `best_for`, `inside`, `picks_empty`, `picks_title`, `ics`, `ics_event` ("{name} opens"), `days`, `hours`, `minutes`, `seconds`, `d`, `h`, `m`, `s`, `flagship`, `cta_single`, `cta_many`.

Match the words to the chosen interaction: with Turn & Circle, "Your circled deals" and "Circle {name}" read better than "saved".
