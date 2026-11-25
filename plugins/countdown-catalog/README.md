# A countdown sale page for your offers, in your brand

**The job it takes off your plate:** building the page for a limited-time sale. Give Claude your offers and dates, and you get a finished sale page with a live countdown and a card for each offer, checked on desktop and phone.

It works for 2 or more offers: one deal a day, everything at once, or a mix. Visitors open a card to read the details and save the ones they want to a shortlist. The page works out on its own which offers are live, coming up or closed, and updates while someone is on it.

## Set it up

1. In Claude Code, add the library once (skip this if you already have):
   `/plugin marketplace add gabeomat/futureproof-workflows`
2. Install this workflow:
   `/plugin install countdown-catalog@futureproof-workflows`
3. Make sure Python 3 is on your computer. Macs usually have it. Type `python3 --version` in a terminal to check.
4. Optional, for the visual check: Claude takes screenshots of the page and fixes what it sees. That needs Node.js and Playwright. If you don't have them, Claude still builds the page and tells you the visual check didn't run.

Have these ready before you start:
- Your offers: name, price, what's included, and the checkout link for each
- The sale dates and your time zone
- Your brand: a website, a brand guide, or colours and fonts. You can also describe a mood or ask Claude for a few looks to pick from.
- Photos of your products, if you have them

## Use it

Type `/countdown-catalog` and say a few words about the sale:

> /countdown-catalog Black Friday sale for my bakery, 3 specials, 1 a day

Starting with `/countdown-catalog` is the only way to run it. This workflow never starts on its own.

Claude works through 6 steps and stops for your OK at 4 of them:

1. **Your brand.** Whose page it is, which brand to use, and dark or light.
2. **The interview.** Dates, the countdown, each offer, a short note and an FAQ. Claude writes the copy and reads the whole plan back to you.
3. **Pick a card style.** You click through 4 options in your own colours: Turn & Circle, Ticket & Stamp, Sheet & Highlight, or Gift & Tag.
4. **Approve a sample.** The top of the page and 2 cards, changed until you like the look.
5. **The full page.** Built and checked over at least 3 rounds on desktop and phone.
6. **Publish.** A full page for Netlify or your own host, or one block of code to paste into GoHighLevel, Kajabi, Squarespace, WordPress and other site builders.

There are 3 countdown options:
- **Fixed date:** everyone sees the same deadline.
- **Per-visitor:** each visitor gets their own countdown from their first visit.
- **Deadline Funnel:** uses your Deadline Funnel account to track each person's deadline.

## Watch the walkthrough

VIDEO LINK

## Make it yours

What would you change about this for your business?
