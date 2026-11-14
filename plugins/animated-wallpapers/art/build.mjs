// Packs art/*.svg into hooks/scenes.js, the strings the mod draws.
// Run after editing a starter scene:  node art/build.mjs
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const art = dirname(fileURLToPath(import.meta.url))
const scenes = {}

for (const file of readdirSync(art).filter(name => name.endsWith('.svg')).sort()) {
  const source = readFileSync(join(art, file), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n+/g, '')
    .trim()

  if (source.length > 131072) {
    throw new Error(`${file} is ${source.length} characters; a scene holds at most 131072`)
  }
  scenes[file.replace(/\.svg$/, '')] = source
}

const body = Object.entries(scenes)
  .map(([id, source]) => `  ${JSON.stringify(id)}: ${JSON.stringify(source)},`)
  .join('\n')

writeFileSync(
  join(art, '..', 'hooks', 'scenes.js'),
  `// Written by art/build.mjs from art/*.svg. Edit the SVG, then run the build.\nexport const SCENES = {\n${body}\n}\n`,
)
console.log(Object.entries(scenes).map(([id, source]) => `${id}: ${source.length}`).join('\n'))
