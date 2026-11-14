# Drawing guide

How to draw a wallpaper scene the app will accept, that stays out of the way of the chat, and that moves well.

## Contents

1. The file the app accepts
2. Where things can sit
3. How to build a scene
4. Animation: the one pattern, then the recipes
5. Making it look good
6. wallpaper.json
7. Mistakes that have happened
8. Checklist for looking at the picture

## 1. The file the app accepts

`add_wallpaper` refuses a scene that breaks any of these.

- One SVG document that starts with `<svg`. No `<?xml ...?>` line before it.
- The opening tag is exactly this shape:
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">`
  No `width` or `height` attributes. `slice` makes the scene fill any window by cropping the overflow.
- At most 131,072 characters. Aim for 8,000 to 14,000: that is a full scene.
- Motion comes from CSS `@keyframes` in one `<style>` block inside the SVG. A scene with no `@keyframes` is refused.
- No `<script>`, no `onclick`-style attributes, no `<foreignObject>`, no `<image>`, nothing loaded from the web (no `http` links, no web fonts).

## 2. Where things can sit

The scene is 1600 wide and 1000 tall. The chat sits on top of it, so most of the middle is covered by frosted panels.

- **Centre column, x 450 to 1150:** the conversation covers this. Keep it calm: sky, water, soft background shapes. Never put the subject here.
- **Bottom centre, y above 780:** the message box covers this.
- **Left third and right third:** the best places for characters and anything the eye should find.
- **Top band, y 60 to 320:** good for a sun, a moon, clouds, anything that floats.
- **The window crops the scene.** A wide window cuts off the top and bottom tenth. A narrow or tall one cuts off the sides. Keep everything that matters inside x 220 to 1380 and y 110 to 890, and never rely on something at the very edge being seen.
- Things that cross the whole scene (a fish, a bird, a rocket) are fine: they pass behind the panels and come out the other side.

## 3. How to build a scene

Draw back to front, in this order:

1. **Background:** one `<rect width="1600" height="1000">` filled with a gradient. Never leave the background bare.
2. **Far layer:** a glow, stars, distant hills, light rays. Low contrast.
3. **Things that drift:** clouds, birds, fish. They cross the scene slowly.
4. **Ground or floor layers:** two or three wavy bands, each a slightly different shade, so the scene has depth. End every such path with `V1000H0Z` so it reaches the bottom corners and leaves no gap.
5. **Characters and props,** on the left and right, standing on the ground layers.
6. **Small foreground motion:** leaves, bubbles, fireflies, sparkles.

Put shapes used more than once in `<defs>` and place them with `<use href="#id">`. Give every id a short unique name.

## 4. Animation

### The one pattern

A CSS animation on an element replaces that element's `transform` attribute. Putting both on the same element makes the thing jump to the corner. So always use two groups:

```svg
<g transform="translate(300 820)">   <!-- where it sits: attribute only -->
  <g class="hop">                     <!-- how it moves: class only -->
    ...shapes drawn around 0,0...
  </g>
</g>
```

Draw each part around its own pivot at `0,0`: feet at 0,0 for something that sways or hops, centre at 0,0 for something that spins, the shoulder at 0,0 for an arm that waves. Rotation and scaling then happen around the right point with no extra CSS.

To combine motions, nest groups: the outer one travels, the next one bobs, the inner one flaps.

Put all timing in classes in the `<style>` block. Do not write `style="..."` on elements.

Do not rely on animation inside shapes placed with `<use>`. Animate a group around the `<use>` instead.

### Recipes

```css
/* drift across, left to right (clouds, fish, birds). Start and end off screen. */
.drift{animation:drift 90s linear infinite}
@keyframes drift{from{transform:translateX(-260px)}to{transform:translateX(1860px)}}

/* the other way. Draw the creature facing right and wrap it in <g transform="scale(-1 1)">. */
@keyframes driftBack{from{transform:translateX(1860px)}to{transform:translateX(-260px)}}

/* bob up and down */
.bob{animation:bob 3s ease-in-out infinite alternate}
@keyframes bob{from{transform:translateY(-14px)}to{transform:translateY(14px)}}

/* sway around the base (plants, trees, tails). Pivot at 0,0. */
.sway{animation:sway 4s ease-in-out infinite alternate}
@keyframes sway{from{transform:rotate(-6deg)}to{transform:rotate(7deg)}}

/* blink: wrap both eyes in one group centred on the eye line */
.blink{animation:blink 5s infinite}
@keyframes blink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}

/* twinkle or pulse a glow */
.tw{animation:tw 3s ease-in-out infinite alternate}
@keyframes tw{from{opacity:.2;transform:scale(.6)}to{opacity:1;transform:scale(1.2)}}

/* rise and fade (bubbles, hearts, z z z) */
.up{animation:up 11s linear infinite}
@keyframes up{0%{transform:translateY(0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-900px);opacity:0}}

/* spin (sun rays, gears, wheels). Centre at 0,0. */
.spin{animation:spin 60s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* flap (wings): squash on one axis, fast */
.flap{animation:flap .4s ease-in-out infinite alternate}
@keyframes flap{from{transform:scaleY(1)}to{transform:scaleY(-.4)}}

/* walk there and back, turning round at each end */
.roam{animation:roam 30s linear infinite}
@keyframes roam{0%{transform:translateX(0) scaleX(1)}47%{transform:translateX(300px) scaleX(1)}50%{transform:translateX(300px) scaleX(-1)}97%{transform:translateX(0) scaleX(-1)}100%{transform:translateX(0) scaleX(1)}}

/* hop: pair with roam, hop on the inner group */
.hop{animation:hop .8s cubic-bezier(.3,0,.7,1) infinite alternate}
@keyframes hop{from{transform:translateY(0)}to{transform:translateY(-30px)}}

/* something that appears now and then (a shooting star): hidden most of the cycle */
.shoot{animation:shoot 13s linear infinite}
@keyframes shoot{0%,86%{transform:translate(0,0);opacity:0}88%,97%{opacity:1}100%{transform:translate(520px,230px);opacity:0}}

/* a line that draws itself along a path (wind) */
.whoosh{stroke-dasharray:170 1500;animation:whoosh 7s linear infinite}
@keyframes whoosh{from{stroke-dashoffset:1670}to{stroke-dashoffset:0}}
```

### Timing

- Slow is better. A wallpaper sits behind someone working. Big moves take 20 to 120 seconds; small ones (blink, sway, bob) 2 to 6.
- Give copies of the same motion different durations and negative delays so they never move in step: `.d2{animation-duration:130s;animation-delay:-60s}`.
- `ease-in-out infinite alternate` suits anything that rocks back and forth. `linear infinite` suits travel and spin.
- End the `<style>` block with this line, so people who turn motion off get a still picture:
  `@media (prefers-reduced-motion:reduce){*{animation:none!important}}`

## 5. Making it look good

- **Flat shapes, no outlines.** Build characters from circles, ellipses and rounded rectangles in two or three colors plus one darker shade.
- **Cute comes from the face:** large eyes with a small white highlight, a short curved smile, round pink cheeks at low opacity. Place the eyes low on the head.
- **Five to seven colors,** used again and again across the scene, plus the background gradient.
- **A glow is a radial gradient that fades to transparent,** not a blur filter. Filters are slow at full-window size.
- **Give characters a reason to be there:** an owl on a branch, a crab on the sand. Check the ground under their feet (see mistake 4).
- **Avoid text in the scene.** Fonts differ from machine to machine. A single decorative letter is the limit.
- **Bright scene or night scene:** decide once. A bright scene has a pale background and saturated characters. A night scene has a dark, tinted background (deep blue, purple or teal, never pure black) with light characters and glowing accents.

## 6. wallpaper.json

Saved beside `scene.svg`:

```json
{
  "name": "Dragon Library",
  "mode": "dark",
  "alt": "A small green dragon asleep on a pile of books while candles flicker",
  "scene": "scene.svg",
  "colors": {
    "accent": "#7fd6a0",
    "light": { "page": "#f3efe6", "text": "#2a2433" },
    "dark": { "page": "#1b1430", "text": "#f2ecff" }
  }
}
```

- `name`: two or three words, at most 40 characters.
- `mode`: `"light"` for a bright scene, `"dark"` for a night scene.
- `alt`: one sentence on what the scene shows and what moves, for someone who cannot see it.
- `colors` tune the app's own panels and text to the scene, in both of the app's modes. Both `light` and `dark` are required, whichever kind the scene is. Every color is six-digit hex.
  - `accent`: the scene's signature color. It colors links and highlights.
  - `light.page`: a very pale tint of the scene's main hue, never pure white. `light.text`: a very dark shade of the same hue, never pure black.
  - `dark.page`: a very dark shade of the scene's main hue. `dark.text`: a very pale tint of it.
  - Keep page and text far apart in lightness. The in-between colors are worked out from these two.
  - Optional, only when a specific look is wanted: `card`, `panel`, `secondary` and `muted` inside `light` or `dark`, and `danger`, `success`, `warning` and `pro` beside `accent`.

## 7. Mistakes that have happened

1. **A thing jumps to the top-left corner.** It has a `transform` attribute and an animated class on the same element. Split it into two groups.
2. **A thing rotates around the wrong point.** Its shapes are not drawn around `0,0`. Redraw them around the pivot.
3. **The subject is missing from the picture.** It was off screen at that moment of its cycle. Take another picture with a different `at`. If it is on screen less than half the time, give it a shorter path or a second copy with a negative delay.
4. **A character floats above the ground or sinks into it.** The ground is a curve, so its height changes along x. Work out the curve's height where the character stands and put the feet there.
5. **A gap at the bottom or side.** A ground or skyline path did not run to the corner. End it with `V1000H0Z`.
6. **A character meant to peek from behind a hill shows through it.** Draw the character before the hill, so the hill covers it. Do not patch over it with an extra shape.
7. **Everything moves in unison.** Copies share one duration. Vary durations and add negative delays.
8. **The scene looks empty in the middle and crowded at the bottom centre.** That is where the message box sits. Move things out to the left and right thirds.
9. **A trail fades the wrong way** (comet, shooting star). The bright end of the gradient belongs at the head.

## 8. Checklist for looking at the picture

Read the picture the preview saved and check each line. Fix anything that fails before adding the wallpaper.

- The whole window is filled: no white or transparent gaps at any edge.
- Every character is whole, the right way up, and standing where intended.
- Nothing important sits in the centre column or the bottom centre.
- Faces read as faces at this size: eyes, mouth, nothing overlapping them.
- The colors hold together: five to seven, repeated.
- In a second picture taken at another time, things have visibly moved and nothing has broken.
- The preview's answer says "The file itself is sound."
