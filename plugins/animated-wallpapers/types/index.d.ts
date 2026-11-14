/** A six-digit hex color, such as `#d9691f`. */
export type Hex = string

/** The colors of one mode: the page and its text, and optionally the layers between. */
export type Anchors = { 'surface-0': Hex; 'text-primary': Hex } & Partial<
  Record<'surface-1' | 'surface-2' | 'surface-3' | 'text-secondary' | 'text-muted', Hex>
>

/** One wallpaper: a starter the plugin ships, or one the person added. */
export type Wallpaper = {
  /** Names the scene: letters, digits and dashes. */
  id: string
  name: string
  /** The scene's own mode: a bright scene or a night one. */
  mode: 'light' | 'dark'
  /** What the scene shows, for a reader who cannot see it. */
  alt: string
  /** How strongly the app's panels frost over the scene. */
  glass?: { blur: number; opacity: number }
  roles: Record<'accent' | 'danger' | 'success' | 'warning' | 'pro', Hex>
  light: Anchors
  dark: Anchors
  /** The drawing, on a wallpaper the person added. A starter's is in scenes.js. */
  svg?: string
}

declare module 'claude-code' {
  interface PluginState {
    'animated-wallpapers': {
      /** The id of the wallpaper showing, or `off`. */
      showing: string
      /** Whether the picker's row is up, above the prompt. */
      isPicking: boolean
      /** Counts changes to the person's own wallpapers, so the picker redraws. */
      stamp: number
    }
  }
}
