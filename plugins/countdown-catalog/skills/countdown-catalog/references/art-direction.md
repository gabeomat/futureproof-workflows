# Art direction

The engine makes the page correct. Art direction makes it look like a designer made it for this brand. Do this before building the sample section.

## What to art-direct

1. **Hero image** (`hero.image`). A wide, moody photo that sets the sale's feeling: product flat-lays, a texture (glitter, linen, paper, fabric), a setting, or the founder in their space. It's graded automatically (`img_brightness`, `img_contrast`, `img_saturate` in brand.json) and fades into the page with a mask, so it never fights the headline. Darker and calmer beats busy. Without one, the page draws a soft glow from the brand colours, which is fine but plainer.
2. **Offer images** (`offers[].image`, 3:4 portrait). Real product mockups, course covers or photos. Mixed styles look messy, so make them consistent: same mockup frame, same lighting, same background family. Without images, each card gets a designed cover in the brand colours (`cover_title`, `cover_line`), with three variations so neighbouring cards differ.
3. **Founder photo** (`note.photo`), arch-cropped. Use a real photo of the person. Without one, the arch shows a monogram.
4. **Photo strip** (`strip`), 3–5 lifestyle or detail images that carry the mood between sections.
5. **Closing image** (`closing.image`) sits behind a frosted-glass facts panel.

## Where images come from (in order)

1. **The user's own photos and product images.** Always best. Ask for them.
2. **Generated images**, if an image-generation tool is connected. Write a real brief for each: subject, mood, palette taken from their brand colours, negative space where text will sit, 3:4 or 16:9. Never generate a real person, a logo, or a fake customer.
3. **Stock photos** they're licensed to use, graded to the brand.
4. **No images.** The procedural hero glow and designed covers. The page still works, just with less depth. Say so.

## Preparing images

- WebP, at most 1920px wide for the hero and 900px for cards. Keep each under about 300KB.
- Put them in the sale folder's `assets/` and refer to them relatively (`assets/hero.webp`) for a full-page publish. For an **embed** publish, upload them to the user's site builder or image host first and use the full `https://` URLs (see `publishing.md`).
- Write real `image_alt` text for offer images. Hero, strip and closing images are decorative and stay empty.

## custom.css: per-page touches

For a signature detail that belongs to this page only, write `custom.css` and pass `--custom-css custom.css`. Rules:
- Use **only** the token variables (`var(--accent)`, `color-mix(in srgb, var(--urgency) 40%, transparent)` …). `check_tokens.py` fails the build on any hex, `rgb()`, named colour or font name.
- Scope everything under `.cc`.
- Keep it small: one or two signature moves (a texture on the bar, a decorative numeral treatment, an extra glow on the flagship), not a redesign.
- If you need the same change for every page, it's an engine change: tell the skill owner instead.

## The look, at a glance

What makes this page type feel premium, so you can keep it there:
- one accent colour, used only for action and "live"
- dark or light, never both
- graded photos that fade into the page instead of hard rectangles
- a two-voice type pairing
- consistent mockups
- one easing curve
- slow ambient loops only on the call to action
- hand-made marks (ink, stamp, tag)
- generous space between sections
