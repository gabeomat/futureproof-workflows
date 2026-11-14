import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'animated-wallpapers',
  component: 'Pane',
  requestId: 'wallpaper-picker',
  props: {
    title: 'Wallpapers',
    isFocused: false,
    bodyColumns: 56,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

const BAND = {
  plugin: 'animated-wallpapers',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 40,
    bodyColumns: 100,
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

// `/wallpaper <args>` as the person types it at the prompt.
const typed = (args: string) =>
  ({
    command: 'wallpaper',
    args,
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 120 },
  }) as const

const DRAGON_SCENE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice"><style>.b{animation:b 3s infinite alternate}@keyframes b{to{transform:translateY(-10px)}}</style><rect width="1600" height="1000" fill="#1b1430"/><g class="b"><circle cx="300" cy="700" r="60" fill="#7fd6a0"/></g></svg>'

const DRAGON = JSON.stringify({
  name: 'Dragon Library',
  mode: 'dark',
  alt: 'A small green dragon asleep on a pile of books',
  scene: 'scene.svg',
  colors: {
    accent: '#7fd6a0',
    light: { page: '#f3efe6', text: '#2a2433' },
    dark: { page: '#1b1430', text: '#f2ecff' },
  },
})

type TestOn = Parameters<Extract<Parameters<typeof test>[1], (...args: never[]) => unknown>>[1]

/** A machine with the files given, a store, and a theme that draws. `isPlaced`: whether a panel is seated. */
function world(on: TestOn, files: Record<string, string>, isPlaced = true) {
  const kept = new Map<string, unknown>()
  const scenes: unknown[] = []
  const written = new Map<string, string>()
  const ran: (readonly string[])[] = []
  const tools: string[] = []
  const opened: string[] = []
  const filled: string[] = []

  on('command.register', () => ({ value: { command: 'wallpaper' } }))
  on('tool.register', (_, e) => {
    tools.push(e.name)

    return { value: { tool: `mcp__animated-wallpapers__${e.name}` } }
  })
  on('ui.open', (_, e) => {
    opened.push(e.id)

    return { value: isPlaced ? { isPlaced: true } : { isPlaced: false, reason: 'no-surface' } }
  })
  on('prompt.fill', (_, e) => {
    filled.push(e.text)

    return { isFilled: true, text: e.text, cursor: e.text.length }
  })
  on('ui.close', () => ({ value: undefined }))
  on('store.get', (_, e) => ({ value: kept.get(e.key) }))
  on('store.set', (_, e) => {
    kept.set(e.key, e.value)

    return { value: undefined }
  })
  on('theme.set', (_, e) => {
    scenes.push(e.backdrop?.scene)

    return { value: { isDrawn: true, requestId: 'look' } }
  })
  on('theme.clear', () => ({ value: { isDrawn: false, reason: 'cleared' } }))
  on('fs.read', (_, e) => {
    const text = files[e.path]

    if (text === undefined) {
      throw new Error(`no file at ${e.path}`)
    }

    return { value: text }
  })
  on('fs.exists', (_, e) => ({ value: e.path in files || written.has(e.path) }))
  on('fs.write', (_, e) => {
    written.set(e.path, e.text)

    return { value: undefined }
  })
  on('process.run', (_, e) => {
    ran.push(e.argv)
    const shot = e.argv.find(part => part.startsWith('--screenshot='))

    if (shot !== undefined) {
      written.set(shot.slice('--screenshot='.length), 'png')
    }

    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })

  return { kept, scenes, written, ran, tools, opened, filled }
}

test('a new session shows the first starter, registers the tools, and opens the picker once', async ($, on) => {
  const { kept, scenes, tools, opened } = world(on, {})

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  kept.set('showing', 'cosmic-critters')
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  kept.set('showing', 'off')
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  expect(scenes).toEqual(['sunrise-meadow', 'cosmic-critters'])
  expect(tools.slice(0, 5)).toEqual([
    'preview_wallpaper',
    'add_wallpaper',
    'list_wallpapers',
    'export_wallpaper',
    'remove_wallpaper',
  ])
  expect(opened).toEqual(['wallpaper-picker'])
})

test('/wallpaper takes a name, part of one, a number, next and off', async ($, on) => {
  const { kept, scenes } = world(on, {})

  const owls = await $.command.run(typed('Moonlit Owls'))
  expect(owls.text).toBe('Wallpaper: Moonlit Owls.')
  await $.command.run(typed('reef'))
  await $.command.run(typed('3'))
  await $.command.run(typed('next'))
  const none = await $.command.run(typed('lava lamp'))
  expect(none.text).toMatch(/No wallpaper is called "lava lamp"/)
  await $.command.run(typed('off'))

  expect(scenes).toEqual(['moonlit-owls', 'bubble-reef', 'robot-recess', 'moonlit-owls'])
  expect(kept.get('showing')).toBe('off')
})

test('a wallpaper the person adds is checked, kept, shown and drawn', async ($, on) => {
  const { kept, scenes } = world(on, {
    '/work/dragon/wallpaper.json': DRAGON,
    '/work/dragon/scene.svg': DRAGON_SCENE,
  })

  const added = await $.tool.call({ tool: 'mcp__animated-wallpapers__add_wallpaper', file: '/work/dragon/wallpaper.json' })
  expect(String(added.result)).toMatch(/^Added "Dragon Library"\. It is showing now\./)
  expect(scenes).toEqual(['dragon-library'])
  expect(kept.get('showing')).toBe('dragon-library')
  expect((kept.get('mine') as { id: string }[]).map(one => one.id)).toEqual(['dragon-library'])

  // The picker lists it after the six starters, and it is the one showing.
  const picker = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await picker.find({ key: 'pick-dragon-library' }))?.props.label).toBe('✓ Dragon Library')
  expect(await picker.find({ key: 'pick-bubble-reef' })).toBeDefined()
  await picker.unmount()

  // The backdrop draws its scene.
  const backdrop = await $.ui.mount({
    plugin: 'animated-wallpapers',
    component: 'Backdrop',
    surface: 'desktop',
    props: { scene: 'dragon-library', plugin: 'animated-wallpapers', glass: { blur: 10, opacity: 0.7 } },
  })
  expect((await backdrop.find({ type: 'Svg' }))?.props.alt).toMatch(/dragon/)
  await backdrop.unmount()

  // Adding the same name again replaces it, never a second copy.
  const again = await $.tool.call({ tool: 'mcp__animated-wallpapers__add_wallpaper', file: '/work/dragon/wallpaper.json' })
  expect(String(again.result)).toMatch(/^Replaced "Dragon Library"/)
  expect((kept.get('mine') as unknown[]).length).toBe(1)

  const listed = await $.tool.call({ tool: 'mcp__animated-wallpapers__list_wallpapers' })
  expect(String(listed.result)).toMatch(/Added:\n- Dragon Library \(night scene\), showing now/)

  const removed = await $.tool.call({ tool: 'mcp__animated-wallpapers__remove_wallpaper', name: 'dragon' })
  expect(String(removed.result)).toBe('Removed "Dragon Library".')
  expect(kept.get('mine')).toEqual([])
  expect(kept.get('showing')).toBe('sunrise-meadow')

  const starter = await $.tool.call({ tool: 'mcp__animated-wallpapers__remove_wallpaper', name: 'Bubble Reef' })
  expect(String(starter.result)).toMatch(/is a starter/)
})

test('a wallpaper the app would refuse is not added, and the answer says what to fix', async ($, on) => {
  const { kept } = world(on, {
    '/work/bad/wallpaper.json': JSON.stringify({ name: 'Bad', mode: 'dusk', colors: { accent: 'orange' } }),
    '/work/bad/scene.svg': '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    '/work/low/wallpaper.json': JSON.stringify({
      name: 'Low',
      mode: 'light',
      alt: 'Grey on grey',
      colors: { accent: '#777777', light: { page: '#808080', text: '#8a8a8a' }, dark: { page: '#1b1430', text: '#f2ecff' } },
    }),
    '/work/low/scene.svg': DRAGON_SCENE,
  })

  const bad = String(
    (await $.tool.call({ tool: 'mcp__animated-wallpapers__add_wallpaper', file: '/work/bad/wallpaper.json' })).result,
  )
  expect(bad).toMatch(/^Not added yet/)
  expect(bad).toMatch(/"alt"/)
  expect(bad).toMatch(/"mode"/)
  expect(bad).toMatch(/"colors\.accent"/)
  expect(bad).toMatch(/"colors\.light"/)
  expect(bad).toMatch(/viewBox/)
  expect(bad).toMatch(/runs no script/)
  expect(bad).toMatch(/Nothing moves/)

  const low = String(
    (await $.tool.call({ tool: 'mcp__animated-wallpapers__add_wallpaper', file: '/work/low/wallpaper.json' })).result,
  )
  expect(low).toMatch(/^Not added yet/)

  const missing = String(
    (await $.tool.call({ tool: 'mcp__animated-wallpapers__add_wallpaper', file: '/work/none/wallpaper.json' })).result,
  )
  expect(missing).toMatch(/Could not read/)
  expect(kept.get('mine')).toBeUndefined()
})

test('a starter exports as the two files a new wallpaper is made of', async ($, on) => {
  const { written } = world(on, {})

  const out = await $.tool.call({ tool: 'mcp__animated-wallpapers__export_wallpaper', name: 'bubble reef', folder: '/work/reef' })
  expect(String(out.result)).toMatch(/Wrote \/work\/reef\/scene\.svg and \/work\/reef\/wallpaper\.json/)
  expect(written.get('/work/reef/scene.svg')).toMatch(/^<svg /)

  const about = JSON.parse(written.get('/work/reef/wallpaper.json') ?? '{}')
  expect(about.name).toBe('Bubble Reef')
  expect(about.mode).toBe('light')
  expect(about.colors.light.page).toBe('#e3f4f6')
})

test('the preview takes a picture with a browser on the machine, and says so when there is none', async ($, on) => {
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  const { ran } = world(on, { '/work/dragon/scene.svg': DRAGON_SCENE, [chrome]: 'binary' })

  const seen = String(
    (await $.tool.call({ tool: 'mcp__animated-wallpapers__preview_wallpaper', scene: '/work/dragon/scene.svg', at: 3 })).result,
  )
  expect(seen).toMatch(/^Picture saved at \/work\/dragon\/scene-3s\.png, taken 3 seconds/)
  expect(seen).toMatch(/The file itself is sound/)
  expect(ran[0]?.[0]).toBe(chrome)
  expect(ran[0]).toContain('--virtual-time-budget=3000')
  expect(ran[0]).toContain('file:///work/dragon/scene.svg')
})

test('with no browser the preview still checks the file', async ($, on) => {
  world(on, { '/work/dragon/scene.svg': DRAGON_SCENE.replace('viewBox="0 0 1600 1000" ', '') })

  const seen = String(
    (await $.tool.call({ tool: 'mcp__animated-wallpapers__preview_wallpaper', scene: '/work/dragon/scene.svg' })).result,
  )
  expect(seen).toMatch(/^No picture: none of Chrome, Edge, Brave or Chromium/)
  expect(seen).toMatch(/needs a viewBox/)
})

test('/wallpaper new puts the request in the message box for the make-wallpaper skill', async ($, on) => {
  const { filled } = world(on, {})

  const ran = await $.command.run(typed('new a sleepy dragon in a library'))
  expect(ran.text).toBe('Press Enter to start drawing it.')
  const bare = await $.command.run(typed('new'))
  expect(bare.text).toMatch(/Say what to draw/)
  expect(filled).toEqual([
    'Use the make-wallpaper skill to make a new animated wallpaper and add it to my picker: a sleepy dragon in a library',
    'Use the make-wallpaper skill to make a new animated wallpaper and add it to my picker: ',
  ])
})

test('where no panel is seated the picker is a row above the prompt', async ($, on) => {
  const { scenes } = world(on, {}, false)

  const shut = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await shut.find({ key: 'pick-bubble-reef' })).toBeUndefined()
  await shut.unmount()

  await $.command.run(typed(''))

  for (const surface of ['terminal', 'desktop', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect(await ui.find({ key: 'pick-cosmic-critters' })).toBeDefined()
    await ui.unmount()
  }

  const open = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await open.press({ key: 'pick-twilight-breeze' })
  expect(scenes).toEqual(['twilight-breeze'])
  expect((await open.find({ key: 'pick-twilight-breeze' }))?.props.label).toBe('✓ Twilight Breeze')
  await open.press({ key: 'close' })
  expect(await open.find({ key: 'pick-bubble-reef' })).toBeUndefined()
  await open.unmount()
})

test('the panel shows the one showing, large, and a glance when minimized', async ($, on) => {
  const { scenes } = world(on, {})

  const ran = await $.command.run(typed(''))
  expect(ran.text).toBe('Wallpaper picker opened in the side panel.')

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /Sunrise Meadow/ }))?.text).toBe('Sunrise Meadow')
  await ui.press({ key: 'pick-moonlit-owls' })
  expect(scenes).toEqual(['moonlit-owls'])
  expect((await ui.find({ type: 'Text', text: /Moonlit Owls/ }))?.text).toBe('Moonlit Owls')
  await ui.unmount()

  const glance = await $.ui.mount({ ...PANE, surface: 'desktop', props: { ...PANE.props, placement: 'widget' } })
  expect(await glance.find({ key: 'pick-moonlit-owls' })).toBeUndefined()
  expect((await glance.find({ type: 'Text' }))?.text).toBe('Moonlit Owls')
  await glance.unmount()
})
