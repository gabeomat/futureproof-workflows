import type { Anchors, Hex } from '../types'

/** `from` moved toward `to` by `share`, 0 to 1, as six-digit hex. */
export function mix(from: Hex, to: Hex, share: number): Hex

/** One mode's anchors with every layer present: the ones given kept, the rest mixed. */
export function fillAnchors(given: Anchors, mode: 'light' | 'dark'): Required<Anchors>
