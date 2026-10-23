// Turns emoji-datasource's emoji.json (1.3 MB) into the compact data the app ships:
//   sections: iOS keyboard groups, each a list of { c, i, k, s? }
//   extra:    [char, image] pairs for chars that aren't in a section (non-qualified forms,
//             obsolete names, mixed skin tones), so typed/pasted emoji still map to an image.
// Run with `npm run build:emoji`. Output is committed to src/data/emojis.json.
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const source = require.resolve('emoji-datasource/emoji.json')
const all = JSON.parse(readFileSync(source, 'utf8'))

const TONES = ['1F3FB', '1F3FC', '1F3FD', '1F3FE', '1F3FF']

// iOS merges "Smileys & Emotion" and "People & Body" into one section.
const SECTIONS = [
  { id: 'people', name: 'Smileys & People', from: ['Smileys & Emotion', 'People & Body'] },
  { id: 'nature', name: 'Animals & Nature', from: ['Animals & Nature'] },
  { id: 'food', name: 'Food & Drink', from: ['Food & Drink'] },
  { id: 'activity', name: 'Activity', from: ['Activities'] },
  { id: 'travel', name: 'Travel & Places', from: ['Travel & Places'] },
  { id: 'objects', name: 'Objects', from: ['Objects'] },
  { id: 'symbols', name: 'Symbols', from: ['Symbols'] },
  { id: 'flags', name: 'Flags', from: ['Flags'] },
]

const toChar = (unified) => String.fromCodePoint(...unified.split('-').map((h) => parseInt(h, 16)))
const toImage = (file) => file.replace(/\.png$/, '')

const sections = SECTIONS.map(({ id, name }) => ({ id, name, emojis: [] }))
const sectionFor = new Map(SECTIONS.flatMap((s, idx) => s.from.map((cat) => [cat, sections[idx]])))

const inSections = new Set()
const extra = new Map()
const addExtra = (unified, image) => {
  if (!unified) return
  const c = toChar(unified)
  if (!inSections.has(c) && !extra.has(c)) extra.set(c, toImage(image))
}

const sorted = [...all].filter((e) => e.has_img_apple).sort((a, b) => a.sort_order - b.sort_order)

for (const e of sorted) {
  const section = sectionFor.get(e.category)
  if (!section || e.obsoleted_by) continue
  const entry = {
    c: toChar(e.unified),
    i: toImage(e.image),
    k: [e.name.toLowerCase(), ...e.short_names.map((n) => n.replace(/_/g, ' '))].join(' '),
  }
  if (e.skin_variations) {
    // Single-tone emoji are keyed "1F3FB"; two-person emoji are keyed "1F3FB-1F3FB".
    // The picker offers the five matching-tone variants, like iOS does by default.
    const tones = TONES.map((t) => e.skin_variations[t] ?? e.skin_variations[`${t}-${t}`])
    if (tones.every((v) => v && v.has_img_apple)) {
      entry.s = tones.map((v) => [toChar(v.unified), toImage(v.image)])
    }
  }
  section.emojis.push(entry)
  inSections.add(entry.c)
  if (entry.s) for (const [c] of entry.s) inSections.add(c)
}

for (const e of sorted) {
  addExtra(e.unified, e.image)
  addExtra(e.non_qualified, e.image)
  for (const v of Object.values(e.skin_variations ?? {})) {
    if (!v.has_img_apple) continue
    addExtra(v.unified, v.image)
    addExtra(v.non_qualified, v.image)
  }
}

const out = { sections, extra: [...extra] }
writeFileSync(new URL('../src/data/emojis.json', import.meta.url), JSON.stringify(out))

for (const s of sections) console.log(`${s.name.padEnd(18)} ${s.emojis.length}`)
console.log(`extra lookups      ${extra.size}`)
