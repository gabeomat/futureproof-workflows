// Fills in the colors a wallpaper leaves out. A person gives a page color and a
// text color for each mode; the layers between (cards, panels, quieter text)
// are mixed from those two, so they always sit in order and stay readable.

function channels(hex) {
  return [1, 3, 5].map(at => parseInt(hex.slice(at, at + 2), 16))
}

/** `from` moved toward `to` by `share`, 0 to 1, as six-digit hex. */
export function mix(from, to, share) {
  const a = channels(from)
  const b = channels(to)

  return `#${a
    .map((value, at) =>
      Math.round(value + ((b[at] ?? value) - value) * share)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`
}

/** One mode's anchors with every layer present: the ones given kept, the rest mixed. */
export function fillAnchors(given, mode) {
  const page = given['surface-0']
  const text = given['text-primary']

  if (mode === 'light') {
    const panel = given['surface-2'] ?? mix(page, '#ffffff', 0.8)

    return {
      'surface-0': page,
      'surface-1': given['surface-1'] ?? mix(page, '#ffffff', 0.45),
      'surface-2': panel,
      'surface-3': panel,
      'text-primary': text,
      'text-secondary': given['text-secondary'] ?? mix(text, page, 0.2),
      'text-muted': given['text-muted'] ?? mix(text, page, 0.32),
    }
  }

  return {
    'surface-0': page,
    'surface-1': given['surface-1'] ?? mix(page, '#ffffff', 0.035),
    'surface-2': given['surface-2'] ?? mix(page, '#ffffff', 0.07),
    'surface-3': given['surface-3'] ?? mix(page, '#ffffff', 0.09),
    'text-primary': text,
    'text-secondary': given['text-secondary'] ?? mix(text, page, 0.18),
    'text-muted': given['text-muted'] ?? mix(text, page, 0.32),
  }
}
