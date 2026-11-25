# Timers

Ask the user which one their sale uses. Describe each in a sentence, answer their questions, and build what they choose. Don't steer them or add warnings about scarcity: the choice is theirs.

## Fixed date: `"timer": { "mode": "fixed" }`

**What to tell them:** "Everyone sees the same deadline, like 'the sale ends Friday at midnight Eastern'."

- Set `start` and `end` on the sale, and `opens` / `closes` on each offer if they differ (one a day, for example).
- The bar counts down to the **live offer's close** while a daily offer is live, otherwise to the sale end (`bar.target: "sale"` forces the sale end).
- Before `start`, the bar counts down to the opening, and buttons point to `before.link`.
- After `end`, the bar shows the `after` message, every card shows Closed, and buttons point to `after.link`.
- The "How it works" schedule and the calendar reminders only exist in this mode.

## Per-visitor (evergreen): `"timer": { "mode": "evergreen", "hours": 72 }`

**What to tell them:** "Each visitor gets their own countdown, which starts on their first visit. Someone who arrives on Tuesday gets 72 hours from Tuesday."

- The first-visit time is remembered in that visitor's browser.
- Each offer can open later and close earlier than the main window: `opens_after_hours`, `closes_after_hours` (hours after the first visit).
- If they ask how it behaves: the clock lives in the visitor's browser, so a different device or a cleared browser starts a new countdown, and the checkout link itself is not changed by the page. If they want the deadline to follow the person across devices and emails, Deadline Funnel does that.

## Deadline Funnel: `"timer": { "mode": "deadline-funnel", "head_html": "…", "bar_html": "…" }`

**What to tell them:** "Deadline Funnel tracks each person's deadline from your emails or ads, so it follows them across devices, and it can redirect the offer when time runs out."

- They need a Deadline Funnel account and campaign. Ask them to paste:
  - the **tracking code** (it goes in the page head) → `timer.head_html`
  - the **countdown embed** for the top bar → `timer.bar_html`
- The page treats every offer as live and lets Deadline Funnel run the countdown and the expiry. The page's own clock is hidden in this mode.
- Test with a real Deadline Funnel test link before publishing, because the timer only shows when Deadline Funnel recognises the visitor.

## Checking it works

Before hand-off, check the state the page is in now, and if you can, the other phases too, by building a test copy of `sale.json` with the dates moved into the past or future:
- **Before:** bar says the "before" message, buttons go to the early list, cards say "Opens …".
- **Live:** the right card says Live now, the bar counts to the right deadline, the main button goes to the live offer's checkout (one live offer) or to the catalog (several).
- **After:** cards say Closed, the bar shows the after message with no clock, buttons go to `after.link`.
