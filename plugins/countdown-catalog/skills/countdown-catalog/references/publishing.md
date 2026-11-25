# Publishing

Ask where the page will live, then build the matching export. Publish only when the user says so.

## Two exports

| Export | Command flag | What you hand over | Use when |
|---|---|---|---|
| **Full page** | `--target page` (default) | the `site/` folder: `index.html` + `assets/` | They can host a whole page: Netlify, Vercel, Cloudflare Pages, GitHub Pages, their own server, a WordPress page template |
| **Embed** | `--target embed` | `site/embed.html`: one block to paste | Their site builder only allows a custom-code element: GoHighLevel, Kajabi, Squarespace, Wix, Webflow, Leadpages, ClickFunnels, WordPress Custom HTML |

## Full page

- **Netlify Drop** (no account set-up needed beyond sign-in): drag the `site` folder onto app.netlify.com/drop. They can connect their own domain afterwards.
- **Their own host:** upload the folder's contents. Images use relative paths, so keep `assets/` next to `index.html`.
- Set `seo.url` to the final address and rebuild, so the share preview and structured data point at the right place.

## Embed (site builders)

1. **Images first.** Upload every image to their builder's media library (or any image host) and replace each `assets/…` path in `sale.json` with the full `https://` URL. Rebuild with `--target embed`.
2. In the builder, add **one** custom-code / custom HTML element, full width, with no padding, and paste the whole of `embed.html`.
3. **Countdown bar:** it sticks to the top of the page. If their builder already has a sticky header, ask whether to keep both. If not, hide theirs on this page.
4. **Head code:** for a Deadline Funnel timer, their tracking code (`timer.head_html`) must also go in the builder's page-level "head tracking code" box, because some builders strip scripts from the head of an embed.
5. Preview in the builder on desktop **and** phone before publishing. Some builders add their own margins or fonts around custom code, so check that the page edges and fonts look the same as the preview you approved.

Notes per builder:
- **GoHighLevel:** use a full-width section with a Custom JS/HTML element, and remove the section's padding.
- **Kajabi:** use a Custom Code section, and set the section background to match the page.
- **Squarespace:** Code Block, with "Display source" off. Business plan or higher is needed for JavaScript.
- **Wix:** an Embed HTML element sits in an iframe, so set its height to the page height and turn off its scroll. The sticky bar sticks inside the frame only, so it's better to host the full page and link to it.
- **WordPress:** a Custom HTML block on a full-width page template.

## Publish checklist (read it to the user)

- [ ] Every offer has its real checkout link, and each one opens the right product.
- [ ] Dates and time zone are right. The countdown shows the expected time left.
- [ ] Before and after links work (early list, after-sale page).
- [ ] Tested on a phone: bar, cards, opening a card, saving a card.
- [ ] Share preview: `seo.title`, `seo.description`, `seo.image` are set.
- [ ] Privacy and terms links work.
- [ ] Their own analytics or pixel added through their host or builder, if they use one. This skill doesn't add tracking.

## Re-running a sale

Copy the sale folder, update dates, offers and copy in `sale.json`, and rebuild. The brand, interaction and art direction carry over.
