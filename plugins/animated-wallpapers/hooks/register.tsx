import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ResolveInput, ThemeResult, ThemeSetArgs } from 'claude-code'

import type { Anchors, Wallpaper } from '../types'
import { makeColors } from './make-colors.js'
import { fillAnchors } from './palette.js'
import { SCENES } from './scenes.js'
import { STARTERS } from './wallpapers.js'

// The picker is a panel beside the chat: a large live preview over every
// wallpaper to pick from. Where nothing seats a panel it is a row above the
// prompt instead.
const PANE = 'wallpaper-picker'

// What the mod keeps between sessions.
const SAVED = 'showing'
const INTRODUCED = 'introduced'
const MINE = 'mine'

const FIRST = 'sunrise-meadow'
const MOST = 40
const LONGEST = 131072
const HEX = /^#[0-9a-f]{6}$/i
const FAILED = 'The wallpaper tool failed. Try once more, and if it fails again say so to the person.'

// What shows now. The picker reads it, so a pick redraws the picker's tick.
const showing = atom({ plugin: 'animated-wallpapers', key: 'showing' } as const, FIRST)
// Whether the picker's row is up, above the prompt.
const isPicking = atom({ plugin: 'animated-wallpapers', key: 'isPicking' } as const, false)
// Counts changes to the person's own wallpapers, so the picker redraws.
const stamp = atom({ plugin: 'animated-wallpapers', key: 'stamp' } as const, 0)

// Where a browser that can take the picture usually lives. A bare name is one
// found on the PATH.
const BROWSERS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
  '/usr/bin/microsoft-edge',
]

const TOOLS = [
  {
    name: 'preview_wallpaper',
    description:
      'Takes a picture of a wallpaper scene (an SVG file) so it can be looked at before it is added. Give the full path of the SVG. Saves a PNG beside it, named for the moment it was taken, and answers with that path and with anything in the file the app would refuse. Read the PNG to see the scene.',
    inputSchema: {
      type: 'object',
      properties: {
        scene: { type: 'string', description: 'Full path of the scene, an .svg file.' },
        at: {
          type: 'number',
          description: 'How far into the animation to take the picture, in seconds. 6 when left out.',
        },
      },
      required: ['scene'],
    },
  },
  {
    name: 'add_wallpaper',
    description:
      'Adds a wallpaper to the picker and shows it. Give the full path of its wallpaper.json, which names the scene file beside it. Answers with what was added, or with what to fix. A wallpaper of the same name is replaced.',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Full path of the wallpaper.json file.' },
      },
      required: ['file'],
    },
  },
  {
    name: 'list_wallpapers',
    description: 'Lists every wallpaper in the picker: the starters and the ones the person added, and which is showing.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'export_wallpaper',
    description:
      'Writes a wallpaper out as files to study or change: scene.svg and wallpaper.json, into the folder given. Works for a starter and for one the person added.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The wallpaper, by name.' },
        folder: { type: 'string', description: 'Full path of the folder to write into.' },
      },
      required: ['name', 'folder'],
    },
  },
  {
    name: 'remove_wallpaper',
    description: 'Removes a wallpaper the person added. The starters stay.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'The wallpaper, by name.' } },
      required: ['name'],
    },
  },
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isWallpaper(value: unknown): value is Wallpaper {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.svg === 'string' &&
    (value.mode === 'light' || value.mode === 'dark') &&
    isRecord(value.roles) &&
    isRecord(value.light) &&
    isRecord(value.dark)
  )
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

/** The folder a path is in, with its separator, whichever kind the path uses. */
function folderOf(path: string): string {
  const cut = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))

  return cut === -1 ? '' : path.slice(0, cut + 1)
}

function join(folder: string, name: string): string {
  if (folder === '' || /[\\/]$/.test(folder)) {
    return `${folder}${name}`
  }

  return `${folder}${folder.includes('\\') && !folder.includes('/') ? '\\' : '/'}${name}`
}

function isAbsolute(path: string): boolean {
  return path.startsWith('/') || /^[a-z]:[\\/]/i.test(path)
}

function fileUrl(path: string): string {
  const forward = path.replace(/\\/g, '/')

  return encodeURI(forward.startsWith('/') ? `file://${forward}` : `file:///${forward}`)
}

/** What the app would refuse or draw wrong in a scene, as plain lines. None when it is sound. */
function faults(svg: string): string[] {
  const found: string[] = []
  const open = /<svg\b[^>]*>/i.exec(svg)?.[0] ?? ''

  if (!/^\s*<svg\b/i.test(svg)) {
    found.push('The file must start with <svg. Take out anything before it, an <?xml line included.')
  }

  if (svg.length > LONGEST) {
    found.push(`The scene is ${svg.length} characters. The app draws at most ${LONGEST}: simplify it.`)
  }

  if (!/\bviewBox\s*=/.test(open)) {
    found.push('The <svg> tag needs a viewBox, such as viewBox="0 0 1600 1000".')
  }

  if (!/preserveAspectRatio\s*=\s*["']xMidYMid slice["']/.test(open)) {
    found.push('The <svg> tag needs preserveAspectRatio="xMidYMid slice" so the scene fills any window.')
  }

  if (/<script\b/i.test(svg) || /\son[a-z]+\s*=/i.test(svg)) {
    found.push('The app runs no script: take out <script> and attributes such as onclick. Animate with CSS in a <style>.')
  }

  if (/<foreignObject\b/i.test(svg)) {
    found.push('Take out <foreignObject>: the app draws SVG shapes only.')
  }

  if (/(href|src)\s*=\s*["'](https?:)?\/\//i.test(svg) || /url\(\s*["']?(https?:)?\/\//i.test(svg)) {
    found.push('The scene loads something from the web. The app loads nothing: draw it in the file itself.')
  }

  if (!/@keyframes\b/.test(svg)) {
    found.push('Nothing moves: the scene has no @keyframes. Add CSS animation in a <style>.')
  }

  return found
}

/** The person's own wallpapers, as kept. */
async function mine($: EngineInterface): Promise<Wallpaper[]> {
  const kept = await $.store.get(MINE)

  return Array.isArray(kept) ? kept.filter(isWallpaper) : []
}

async function everyOne($: EngineInterface): Promise<Wallpaper[]> {
  return [...STARTERS, ...(await mine($))]
}

function sceneOf(one: Wallpaper): string {
  return one.svg ?? SCENES[one.id] ?? ''
}

/** The wallpaper a person means by an id, a name, part of one, or its number in the list. */
function byAsk(list: readonly Wallpaper[], ask: string): Wallpaper | undefined {
  const words = slug(ask)
  const nth = Number(ask.trim())

  if (Number.isInteger(nth) && nth >= 1 && nth <= list.length) {
    return list[nth - 1]
  }

  if (words === '') {
    return undefined
  }

  return (
    list.find(one => one.id === words || slug(one.name) === words) ??
    list.find(one => one.id.includes(words) || slug(one.name).includes(words))
  )
}

// Each wallpaper is a whole look: the scene, how the panels frost over it, and
// the app's own colors tuned to it in both modes, so the person's mode stands.
function lookOf(one: Wallpaper): { look: ThemeSetArgs; unpainted: string[] } {
  const { theme, problems } = makeColors({
    label: one.name,
    roles: one.roles,
    light: { gray: { anchors: one.light } },
    dark: { gray: { anchors: one.dark } },
  })

  return {
    look: { colors: theme, backdrop: { scene: one.id, glass: one.glass ?? { blur: 10, opacity: 0.7 } } },
    unpainted: problems.filter(line => line.startsWith("Desktop won't paint")),
  }
}

// Sets the whole look. An older build that takes no `colors` refuses the call
// by that name, so the scene is then set alone and the app keeps its own
// colors; one that refuses the scene too draws nothing, and says why.
async function setLook($: EngineInterface, one: Wallpaper): Promise<ThemeResult> {
  const { look } = lookOf(one)

  try {
    return await $.theme.set(look)
  } catch {
    try {
      return await $.theme.set({ backdrop: look.backdrop })
    } catch (error) {
      return { isDrawn: false, reason: error instanceof Error ? error.message : String(error) }
    }
  }
}

async function show($: EngineInterface, one: Wallpaper): Promise<ThemeResult> {
  const set = await setLook($, one)
  await $.store.set(SAVED, one.id)
  await update($, showing, () => one.id)

  return set
}

// The person turned them off: the one place this mod clears the theme.
async function turnOff($: EngineInterface): Promise<void> {
  await $.theme.clear()
  await $.store.set(SAVED, 'off')
  await update($, showing, () => 'off')
}

async function showNext($: EngineInterface): Promise<Wallpaper | undefined> {
  const list = await everyOne($)
  const now = await read($, showing)
  const next = list[(list.findIndex(one => one.id === now) + 1) % list.length]

  if (next !== undefined) {
    await show($, next)
  }

  return next
}

/** Opens the picker: the panel where a surface seats one, the row otherwise. */
async function openPicker($: EngineInterface): Promise<'panel' | 'row'> {
  const { isPlaced } = await $.ui.open({ id: PANE, title: 'Wallpapers', columns: 56 })
  await update($, isPicking, () => !isPlaced)

  return isPlaced ? 'panel' : 'row'
}

function colorOf(value: unknown): string | undefined {
  return typeof value === 'string' && HEX.test(value) ? value.toLowerCase() : undefined
}

/**
 * One mode's colors from a wallpaper.json: `page` and `text`, and the optional
 * layers. The layers left out are mixed from those two, so they stay readable.
 */
function anchorsOf(value: unknown, mode: 'light' | 'dark'): Anchors | undefined {
  if (!isRecord(value)) {
    return undefined
  }
  const page = colorOf(value.page)
  const text = colorOf(value.text)

  if (page === undefined || text === undefined) {
    return undefined
  }
  const anchors: Anchors = { 'surface-0': page, 'text-primary': text }
  const card = colorOf(value.card)
  const panel = colorOf(value.panel)
  const secondary = colorOf(value.secondary)
  const muted = colorOf(value.muted)

  if (card !== undefined) {
    anchors['surface-1'] = card
  }

  if (panel !== undefined) {
    anchors['surface-2'] = panel
  }

  if (secondary !== undefined) {
    anchors['text-secondary'] = secondary
  }

  if (muted !== undefined) {
    anchors['text-muted'] = muted
  }

  return fillAnchors(anchors, mode)
}

/** Reads a wallpaper.json and its scene, checks both, keeps the wallpaper and shows it. */
async function addFrom($: EngineInterface, file: string): Promise<{ isAdded: boolean; text: string }> {
  if (!isAbsolute(file)) {
    return { isAdded: false, text: `Give the full path of wallpaper.json. "${file}" is not one.` }
  }
  let parsed: unknown

  try {
    parsed = JSON.parse(await $.fs.read(file))
  } catch (error) {
    return {
      isAdded: false,
      text: `Could not read ${file} as JSON: ${error instanceof Error ? error.message : String(error)}`,
    }
  }

  if (!isRecord(parsed)) {
    return { isAdded: false, text: `${file} must hold one JSON object.` }
  }
  const fix: string[] = []
  const name = typeof parsed.name === 'string' ? parsed.name.trim().slice(0, 40) : ''
  const alt = typeof parsed.alt === 'string' ? parsed.alt.trim().slice(0, 300) : ''
  const mode = parsed.mode === 'light' || parsed.mode === 'dark' ? parsed.mode : undefined
  const colors = isRecord(parsed.colors) ? parsed.colors : {}
  const accent = colorOf(colors.accent)
  const light = anchorsOf(colors.light, 'light')
  const dark = anchorsOf(colors.dark, 'dark')

  if (slug(name) === '') {
    fix.push('"name": a short name with letters in it, such as "Dragon Library".')
  }

  if (alt === '') {
    fix.push('"alt": one sentence saying what the scene shows, for a reader who cannot see it.')
  }

  if (mode === undefined) {
    fix.push('"mode": "light" for a bright scene or "dark" for a night one.')
  }

  if (accent === undefined) {
    fix.push('"colors.accent": one six-digit hex color, such as "#d9691f".')
  }

  if (light === undefined) {
    fix.push('"colors.light": { "page": "#f8efde", "text": "#33261a" }, six-digit hex, a pale page and dark text.')
  }

  if (dark === undefined) {
    fix.push('"colors.dark": { "page": "#231a12", "text": "#f6ead8" }, six-digit hex, a dark page and pale text.')
  }
  const sceneFile = typeof parsed.scene === 'string' && parsed.scene.trim() !== '' ? parsed.scene.trim() : 'scene.svg'
  const scenePath = isAbsolute(sceneFile) ? sceneFile : join(folderOf(file), sceneFile)
  let svg = ''

  try {
    svg = (await $.fs.read(scenePath)).trim()
  } catch {
    fix.push(`The scene file was not found at ${scenePath}. Name it in "scene", or save it as scene.svg beside wallpaper.json.`)
  }

  if (svg !== '') {
    fix.push(...faults(svg))
  }

  if (fix.length > 0 || mode === undefined || accent === undefined || light === undefined || dark === undefined) {
    return { isAdded: false, text: `Not added yet. Fix these, then add it again:\n- ${fix.join('\n- ')}` }
  }
  const kept = await mine($)
  const plain = slug(name)
  const id = STARTERS.some(one => one.id === plain) ? `my-${plain}` : plain
  const isNew = !kept.some(one => one.id === id)

  if (isNew && kept.length >= MOST) {
    return { isAdded: false, text: `The picker holds ${MOST} added wallpapers. Remove one first.` }
  }
  const one: Wallpaper = {
    id,
    name,
    mode,
    alt,
    roles: {
      accent,
      danger: colorOf(colors.danger) ?? '#c8443c',
      success: colorOf(colors.success) ?? '#2f8f5b',
      warning: colorOf(colors.warning) ?? '#b7791f',
      pro: colorOf(colors.pro) ?? '#8757b0',
    },
    light,
    dark,
    svg,
  }
  let unpainted: string[]

  try {
    unpainted = lookOf(one).unpainted
  } catch (error) {
    return {
      isAdded: false,
      text: `Not added yet. The colors can't be used: ${error instanceof Error ? error.message : String(error)}`,
    }
  }

  if (unpainted.length > 0) {
    return {
      isAdded: false,
      text: `Not added yet. The app would not paint these colors:\n- ${unpainted.join('\n- ')}\nMake the text and the page further apart in lightness, then add it again.`,
    }
  }
  await $.store.set(MINE, [...kept.filter(other => other.id !== id), one])
  await update($, stamp, count => count + 1)
  const set = await show($, one)

  return {
    isAdded: true,
    text: `${isNew ? 'Added' : 'Replaced'} "${name}". ${
      set.isDrawn
        ? 'It is showing now.'
        : `It is kept and picked, but nothing draws it in this session (${set.reason}); it shows in the Claude desktop or mobile app.`
    } /wallpaper opens the picker.`,
  }
}

/** Takes a picture of a scene file with a browser already on the machine. */
async function previewOf($: EngineInterface, scene: string, at: number): Promise<string> {
  if (!isAbsolute(scene)) {
    return `Give the full path of the scene. "${scene}" is not one.`
  }
  let svg: string

  try {
    svg = await $.fs.read(scene)
  } catch {
    return `No scene file at ${scene}.`
  }
  const found = faults(svg.trim())
  const notes =
    found.length > 0 ? `\nFix these before adding it:\n- ${found.join('\n- ')}` : '\nThe file itself is sound.'
  let browser: string | undefined

  for (const path of BROWSERS) {
    if (await $.fs.exists(path)) {
      browser = path
      break
    }
  }

  if (browser === undefined) {
    return `No picture: none of Chrome, Edge, Brave or Chromium was found on this computer. Skip the look, add the wallpaper, and ask the person how it looks.${notes}`
  }
  const seconds = Number.isFinite(at) ? Math.min(60, Math.max(0, Math.round(at))) : 6
  // Named for its moment, so a second picture never replaces the first.
  const image = `${scene.replace(/\.svg$/i, '')}-${seconds}s.png`

  try {
    const ran = await $.process.run(
      [
        browser,
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--window-size=1440,900',
        `--virtual-time-budget=${seconds * 1000}`,
        `--screenshot=${image}`,
        fileUrl(scene),
      ],
      { timeoutMs: 90000 },
    )

    if (!(await $.fs.exists(image))) {
      return `No picture: the browser ran and saved nothing (exit ${ran.exitCode}). ${ran.stderr.slice(-300)}${notes}`
    }
  } catch (error) {
    return `No picture: the browser could not be run (${error instanceof Error ? error.message : String(error)}).${notes}`
  }

  return `Picture saved at ${image}, taken ${seconds} seconds into the animation in a 1440 by 900 window. Read it to see the scene.${notes}`
}

async function exportTo($: EngineInterface, name: string, folder: string): Promise<string> {
  const one = byAsk(await everyOne($), name)

  if (one === undefined) {
    return `No wallpaper is called "${name}".`
  }

  if (!isAbsolute(folder)) {
    return `Give the full path of the folder. "${folder}" is not one.`
  }
  const about = {
    name: one.name,
    mode: one.mode,
    alt: one.alt,
    scene: 'scene.svg',
    colors: {
      accent: one.roles.accent,
      danger: one.roles.danger,
      success: one.roles.success,
      warning: one.roles.warning,
      pro: one.roles.pro,
      light: {
        page: one.light['surface-0'],
        text: one.light['text-primary'],
        card: one.light['surface-1'],
        panel: one.light['surface-2'],
        secondary: one.light['text-secondary'],
        muted: one.light['text-muted'],
      },
      dark: {
        page: one.dark['surface-0'],
        text: one.dark['text-primary'],
        card: one.dark['surface-1'],
        panel: one.dark['surface-2'],
        secondary: one.dark['text-secondary'],
        muted: one.dark['text-muted'],
      },
    },
  }

  try {
    await $.fs.write(join(folder, 'scene.svg'), sceneOf(one))
    await $.fs.write(join(folder, 'wallpaper.json'), `${JSON.stringify(about, null, 2)}\n`)
  } catch (error) {
    return `Could not write into ${folder}: ${error instanceof Error ? error.message : String(error)}`
  }

  return `Wrote ${join(folder, 'scene.svg')} and ${join(folder, 'wallpaper.json')} for "${one.name}".`
}

async function removeBy($: EngineInterface, name: string): Promise<string> {
  const kept = await mine($)
  const one = byAsk(kept, name)

  if (one === undefined) {
    return byAsk(STARTERS, name) === undefined
      ? `No added wallpaper is called "${name}".`
      : `"${name}" is a starter, and the starters stay.`
  }
  await $.store.set(
    MINE,
    kept.filter(other => other.id !== one.id),
  )
  await update($, stamp, count => count + 1)

  if ((await read($, showing)) === one.id) {
    const first = STARTERS[0]

    if (first !== undefined) {
      await show($, first)
    }
  }

  return `Removed "${one.name}".`
}

async function listOf($: EngineInterface): Promise<string> {
  const now = await read($, showing)
  const own = await mine($)
  const line = (one: Wallpaper) =>
    `- ${one.name} (${one.mode === 'light' ? 'bright' : 'night'} scene)${one.id === now ? ', showing now' : ''}`

  return [
    'Starters:',
    ...STARTERS.map(line),
    own.length > 0 ? 'Added:' : 'Added: none yet.',
    ...own.map(line),
    now === 'off' ? 'Wallpapers are off.' : '',
  ]
    .filter(text => text !== '')
    .join('\n')
}

/** One card per wallpaper: a live thumbnail where the surface draws one, over a button that picks it. */
function cards($: EngineInterface, e: ResolveInput, list: readonly Wallpaper[], now: string, width: number) {
  const table = $.ui.resolve(e)
  const { Box, Button } = table
  const Svg = 'Svg' in table ? table.Svg : undefined

  return (
    <Box flexDirection="row" flexWrap="wrap" gap="sm">
      {list.map(one => (
        <Box key={`card-${one.id}`} flexDirection="column" gap="xs">
          {Svg !== undefined && (
            <Svg source={sceneOf(one)} alt={one.alt} width={width} height={Math.round(width * 0.625)} />
          )}
          <Button
            key={`pick-${one.id}`}
            label={one.id === now ? `✓ ${one.name}` : one.name}
            onPress={async () => {
              await show($, one)
            }}
          />
        </Box>
      ))}
    </Box>
  )
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'wallpaper',
      description: 'Pick an animated wallpaper, or make a new one',
      argumentHint: '[name | next | off | new <what to draw> | remove <name>]',
    })

    for (const tool of TOOLS) {
      await $.tool.register(tool)
    }

    const saved = await $.store.get(SAVED)
    const list = await everyOne($)
    const one = list.find(other => other.id === saved) ?? (saved === 'off' ? undefined : list[0])

    if (one === undefined) {
      await update($, showing, () => 'off')
    } else {
      await update($, showing, () => one.id)
      await setLook($, one)
    }

    // The first time the mod loads, the picker opens by itself, once.
    if ((await $.store.get(INTRODUCED)) !== true) {
      await $.store.set(INTRODUCED, true)
      await openPicker($)
    }

    return next(e)
  })

  on('command.run', { command: 'wallpaper' }, async ($, e) => {
    const ask = e.args.trim()
    const [first = '', ...others] = ask.split(/\s+/)
    const verb = first.toLowerCase()
    const rest = others.join(' ').trim()

    if (ask === '') {
      const where = await openPicker($)

      return {
        text:
          where === 'panel'
            ? 'Wallpaper picker opened in the side panel.'
            : 'Pick a wallpaper in the row above the message box, or type /wallpaper and a name.',
      }
    }

    // A command can't start a turn itself, so the request is put in the
    // message box, ready for the person to send or finish.
    if (verb === 'new' || verb === 'make') {
      const request = `Use the make-wallpaper skill to make a new animated wallpaper and add it to my picker: ${rest}`
      const { isFilled } = await $.prompt.fill({ text: request, mode: 'replace' })

      if (!isFilled) {
        return { text: `Send this as a message: ${request}${rest === '' ? '(what to draw)' : ''}` }
      }

      return {
        text:
          rest === ''
            ? 'Say what to draw at the end of the message, then press Enter.'
            : 'Press Enter to start drawing it.',
      }
    }

    if (verb === 'add') {
      return { text: (await addFrom($, rest)).text }
    }

    if (verb === 'remove' || verb === 'delete') {
      return { text: await removeBy($, rest) }
    }

    if (verb === 'list') {
      return { text: await listOf($) }
    }

    if (verb === 'row') {
      await update($, isPicking, () => true)

      return { text: 'Wallpaper picker opened in the row above the message box.' }
    }

    if (verb === 'close') {
      await update($, isPicking, () => false)
      await $.ui.close({ id: PANE }).catch(() => undefined)

      return { text: 'Wallpaper picker closed.' }
    }

    if (verb === 'off') {
      await turnOff($)

      return { text: 'Wallpapers are off. /wallpaper brings them back.' }
    }

    if (verb === 'next') {
      const next = await showNext($)

      return { text: next === undefined ? 'There are no wallpapers.' : `Wallpaper: ${next.name}.` }
    }
    const list = await everyOne($)
    const one = byAsk(list, ask)

    if (one === undefined) {
      return { text: `No wallpaper is called "${ask}". There are: ${list.map(other => other.name).join(', ')}.` }
    }
    const set = await show($, one)

    return {
      text: set.isDrawn
        ? `Wallpaper: ${one.name}.`
        : `${one.name} is picked, but nothing draws it here: ${set.reason}`,
    }
  })

  // The tools the make-wallpaper skill works with. A tool that fails says so
  // to the model, which no other hook would answer.
  on('tool.call', { tool: 'mcp__animated-wallpapers__preview_wallpaper' }, async ($, e) => ({
    result: await previewOf($, String(e.scene ?? ''), Number(e.at ?? 6)),
  })).catch(() => ({ deny: FAILED }))

  on('tool.call', { tool: 'mcp__animated-wallpapers__add_wallpaper' }, async ($, e) => ({
    result: (await addFrom($, String(e.file ?? ''))).text,
  })).catch(() => ({ deny: FAILED }))

  on('tool.call', { tool: 'mcp__animated-wallpapers__list_wallpapers' }, async $ => ({
    result: await listOf($),
  })).catch(() => ({ deny: FAILED }))

  on('tool.call', { tool: 'mcp__animated-wallpapers__export_wallpaper' }, async ($, e) => ({
    result: await exportTo($, String(e.name ?? ''), String(e.folder ?? '')),
  })).catch(() => ({ deny: FAILED }))

  on('tool.call', { tool: 'mcp__animated-wallpapers__remove_wallpaper' }, async ($, e) => ({
    result: await removeBy($, String(e.name ?? '')),
  })).catch(() => ({ deny: FAILED }))

  // The scene itself, behind the conversation. The app sizes it to the window.
  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }
    const one = (await everyOne($)).find(other => other.id === e.props.scene)

    if (one === undefined) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)

    return <Svg source={sceneOf(one)} alt={one.alt} isInteractive />
  })

  // The picker as a panel beside the chat: the wallpaper showing, large and
  // live, then every one to pick from. A pick changes the app and this preview.
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const now = await read($, showing)
    await read($, stamp)
    const list = await everyOne($)
    const one = list.find(other => other.id === now)
    const table = $.ui.resolve(e)
    const { Box, Button, Text } = table
    const Svg = 'Svg' in table ? table.Svg : undefined

    // Minimized, the panel is a glance: the wallpaper showing and its name.
    if (e.props.placement === 'widget') {
      return (
        <Box flexDirection="column" gap="xs">
          {Svg !== undefined && one !== undefined && (
            <Svg source={sceneOf(one)} alt={one.alt} width={176} height={110} />
          )}
          <Text>{one?.name ?? 'Wallpapers are off'}</Text>
        </Box>
      )
    }

    return (
      <Box flexDirection="column" gap="md" padding="sm">
        {Svg !== undefined && one !== undefined && <Svg source={sceneOf(one)} alt={one.alt} />}
        <Box flexDirection="column">
          <Text bold>{one?.name ?? 'Wallpapers are off'}</Text>
          <Text dimColor>
            {one === undefined
              ? 'Pick one to turn them back on.'
              : `${one.mode === 'light' ? 'Bright scene' : 'Night scene'}. Showing now, behind the chat.`}
          </Text>
        </Box>
        {cards($, e, list, now, 150)}
        <Box flexDirection="row" gap="sm">
          <Button
            key="next"
            label="Next"
            onPress={async () => {
              await showNext($)
            }}
          />
          <Button key="off" label="Turn off" dimColor onPress={() => turnOff($)} />
        </Box>
        <Text dimColor>Make your own: /wallpaper new a sleepy dragon in a library</Text>
      </Box>
    )
  })

  // The picker as a row right above the prompt, for where no panel is seated
  // (and /wallpaper row): a live thumbnail of each over a button that picks it.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const isUp = await read($, isPicking)

    if (!isUp || e.props.hasSurvey) {
      return next(e)
    }
    const now = await read($, showing)
    await read($, stamp)
    const list = await everyOne($)
    const { Box, Button, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column" gap="sm">
        <Box flexDirection="row" gap="sm" alignItems="center">
          <Text bold>/wallpaper</Text>
          <Text dimColor>
            {now === 'off' ? 'Wallpapers are off. Pick one to turn them on.' : 'Animated wallpapers'}
          </Text>
        </Box>
        {cards($, e, list, now, 120)}
        <Box flexDirection="row" gap="sm">
          <Button
            key="next"
            label="Next"
            onPress={async () => {
              await showNext($)
            }}
          />
          <Button key="off" label="Turn off" dimColor onPress={() => turnOff($)} />
          <Button key="close" label="Close" onPress={() => update($, isPicking, () => false)} />
        </Box>
      </Box>
    )
  })
}
