# The interview

Goal: a complete, real `sale.json` without making the user feel interrogated.

**How to run it**
- **Pull before you ask.** Offers, prices, links, bios and FAQs often already live in their workspace, website, course platform or an earlier `sale.json`. Fill what you can, then ask only for what's missing.
- **Ask a few questions at a time**, grouped as below. Give a sensible default with each one so a quick "yes" is enough.
- **Explain any term in one sentence** the first time you use it (countdown bar, per-visitor timer, flagship, shelf). Many users aren't technical.
- **Write the copy yourself** from what they tell you, in their voice (their voice skill if installed), then show it for approval. Don't ask them to write taglines from scratch.

## Round 1: the shape of the sale

1. **What's the sale called, and when does it run?** (name, start, end, time zone)
2. **How do the offers open?**
   - *One a day*: each offer gets its own 24 hours (or its own window).
   - *All at once*: everything is live for the whole sale.
   - *A mix*: daily offers plus some that stay open all week (these go on the **shelf**, a row of smaller cards under the main ones).
3. **Which timer?** Ask using `timers.md`: one fixed deadline for everyone, a per-visitor countdown, or Deadline Funnel. Describe each in a sentence, then let them choose.
4. **Is one offer the headline act?** It can be marked as the **flagship**, which gets a gold-edged card and a label.

## Round 2: each offer (repeat per offer)

| Ask for | Becomes | Default if they don't know |
|---|---|---|
| Name | `name` | (required) |
| The one line that sells it ("First time ever, 57% off") | `tagline` | Write it from the price and the hook |
| What it is, in two sentences | `description` | Write it from their sales page |
| Who it's for | `best_for` | Write it as a situation, e.g. "You have an email list and suspect it's leaking sales." |
| What's inside (3–5 items) | `inside` | From their sales page |
| Sale price / normal price | `price` / `was` | |
| Checkout link | `link` | (required for a live page) |
| Image of the product, or none | `image` | No image → a designed cover in their colours |
| When it opens and closes | `opens` / `closes` | From Round 1 |

## Round 3: around the offers

- **Before the sale opens:** where should people go? (an early-list or waitlist link → `before.link`)
- **After it closes:** where should the button point? (their shop, a waitlist, next year's list → `after.link`)
- **The note:** a short personal note on why this sale exists, plus a photo of them if they have one (`note`). Two short paragraphs.
- **FAQ:** the questions people actually ask before buying (timing, time zones, buying more than one, refunds, access, team purchases). Write the answers from what they tell you.
- **Closing section:** a final heading, two sentences, and 2–3 quick facts (dates, opening time, contact email).
- **Photo strip (optional):** 3–5 mood or lifestyle images that fit the sale.
- **Footer:** privacy and terms links.

## Read-back before building (approval stop 2, required)

This is a stop: end your turn here and wait for the user's OK, even for a demo. Summarise in plain words the brand you'll use and dark or light, then the sale name and dates, the timer, each offer with its day, price and link, the flagship, and what's still missing. Fix anything they correct, then write `sale.json` (`sale-file.md`) and move to the interaction sampler.

## Things to catch

- **Missing checkout links**: the build warns. A page can be previewed without them, never published.
- **Times without a time zone**: always store dates with an offset, e.g. `2026-11-23T06:00:00-05:00`. Check daylight saving for their dates (New York is -05:00 in winter and -04:00 in summer).
- **Copy that repeats the dates the page already shows**: the countdown, pills and schedule are generated, so keep the copy free of them unless it's a deliberate line like the hero eyebrow.
- **Only one offer**: see "Before you start" in SKILL.md.
