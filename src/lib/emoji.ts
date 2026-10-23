import emojiRegex from 'emoji-regex'
import data from '../data/emojis.json'
import { load, save } from './storage'

export type Emoji = {
  c: string // the emoji itself
  i: string // Apple image file name, without .png
  k: string // search keywords
  s?: [string, string][] // five skin-tone variants: [char, image]
}
export type Section = { id: string; name: string; emojis: Emoji[] }

export const SECTIONS = data.sections as Section[]

// Apple images (emoji-datasource, served by jsDelivr with CORS so the PNG export can read them).
// 64px for the keyboard, 160px for the text box so exports stay sharp.
export const keyboardUrl = (image: string) =>
  `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@16.0.0/img/apple/64/${image}.png`
export const textUrl = (image: string) =>
  `https://cdn.jsdelivr.net/gh/iamcal/emoji-data@v16.0.0/img-apple-160/${image}.png`

const imageByChar = new Map<string, string>(data.extra as [string, string][])
for (const section of SECTIONS) {
  for (const e of section.emojis) {
    imageByChar.set(e.c, e.i)
    for (const [c, i] of e.s ?? []) imageByChar.set(c, i)
  }
}

export function imageFor(char: string): string | undefined {
  return imageByChar.get(char) ?? imageByChar.get(char.replace(/️/g, '')) ?? imageByChar.get(char + '️')
}

export function emojiHtml(char: string, image: string) {
  return `<img class="tt-emoji" data-emoji="${char}" alt="${char}" draggable="false" crossorigin="anonymous" src="${textUrl(image)}">`
}

function createEmojiImg(char: string, image: string) {
  const tpl = document.createElement('template')
  tpl.innerHTML = emojiHtml(char, image)
  return tpl.content.firstChild as HTMLImageElement
}

type Caret = { node: Node; offset: number } | { before: Node } | { after: Node }

function placeCaret(caret: Caret) {
  const sel = window.getSelection()
  if (!sel) return
  const range = document.createRange()
  if ('node' in caret) range.setStart(caret.node, caret.offset)
  else if ('before' in caret) range.setStartBefore(caret.before)
  else range.setStartAfter(caret.after)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
}

// Swaps emoji typed with the system keyboard (or pasted) for Apple images, keeping the caret in place.
export function replaceNativeEmoji(root: HTMLElement): boolean {
  const sel = window.getSelection()
  const inRoot = sel && sel.rangeCount > 0 && root.contains(sel.focusNode)
  const caretNode = inRoot ? sel.focusNode : null
  const caretOffset = inRoot ? sel.focusOffset : 0
  // When the caret sits between nodes, remember the node right after it.
  const caretRef = caretNode && caretNode.nodeType !== Node.TEXT_NODE ? caretNode.childNodes[caretOffset] ?? null : null

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text)

  let changed = false
  let caret: Caret | null = null

  for (const node of textNodes) {
    const text = node.data
    const parts: (string | { char: string; image: string })[] = []
    let last = 0
    for (const match of text.matchAll(emojiRegex())) {
      const image = imageFor(match[0])
      if (!image) continue
      parts.push(text.slice(last, match.index), { char: match[0], image })
      last = match.index + match[0].length
    }
    if (!parts.length) continue
    parts.push(text.slice(last))
    changed = true

    const frag = document.createDocumentFragment()
    const caretHere = node === caretNode
    let pos = 0
    for (const part of parts) {
      if (typeof part === 'string') {
        if (!part) continue
        const t = document.createTextNode(part)
        frag.append(t)
        if (caretHere && !caret && caretOffset >= pos && caretOffset <= pos + part.length) {
          caret = { node: t, offset: caretOffset - pos }
        }
        pos += part.length
      } else {
        const img = createEmojiImg(part.char, part.image)
        frag.append(img)
        const end = pos + part.char.length
        if (caretHere && !caret) {
          if (caretOffset <= pos) caret = { before: img }
          else if (caretOffset <= end) caret = { after: img }
        }
        pos = end
      }
    }
    if (node === caretRef && !caret) caret = { before: frag.firstChild! }
    node.replaceWith(frag)
  }

  if (changed && caret) placeCaret(caret)
  return changed
}

// Keeps only text, <br> and our emoji images (pasted or browser-inserted markup is flattened).
export function sanitize(root: HTMLElement): boolean {
  let changed = false
  const clean = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) return
    if (node.nodeType !== Node.ELEMENT_NODE) {
      node.parentNode?.removeChild(node)
      changed = true
      return
    }
    const el = node as HTMLElement
    if (el.tagName === 'BR') {
      if (el.attributes.length) {
        el.replaceWith(document.createElement('br'))
        changed = true
      }
      return
    }
    if (el.tagName === 'IMG' && el.dataset.emoji) {
      el.removeAttribute('style') // some browsers copy computed styles onto inserted HTML
      return
    }
    changed = true
    if (el.tagName === 'IMG') {
      el.replaceWith(document.createTextNode(el.getAttribute('alt') ?? ''))
      return
    }
    const children = [...el.childNodes]
    const frag = document.createDocumentFragment()
    if (/^(DIV|P|LI|H[1-6])$/.test(el.tagName) && el.previousSibling) frag.append(document.createElement('br'))
    frag.append(...children)
    el.replaceWith(frag)
    children.forEach(clean)
  }
  ;[...root.childNodes].forEach(clean)
  return changed
}

// "Frequently Used", like iOS: counts + recency, seeded with iOS's usual favourites.
const FREQ_KEY = 'tt.frequent'
const TONE_KEY = 'tt.tones'
const SEED = '😂 ❤️ 😍 🤣 😊 🙏 💕 😭 😘 👍 😅 👏 😁 🔥 🥰 💔 💖 💙 😢 🤔 😆 🙄 💪 😉 ☺️ 👌 🤗 💜 😔 😎'.split(' ')
export const FREQUENT_COUNT = 30

type Usage = Record<string, { n: number; t: number }>

export function frequentEmoji(): string[] {
  const usage = load<Usage>(FREQ_KEY, {})
  const used = Object.entries(usage)
    .sort(([, a], [, b]) => b.n - a.n || b.t - a.t)
    .map(([c]) => c)
    .filter((c) => imageFor(c))
  const list = [...used]
  for (const c of SEED) if (list.length < FREQUENT_COUNT && !list.includes(c)) list.push(c)
  return list.slice(0, FREQUENT_COUNT)
}

export function recordUse(char: string) {
  const usage = load<Usage>(FREQ_KEY, {})
  const prev = usage[char]
  usage[char] = { n: (prev?.n ?? 0) + 1, t: Date.now() }
  save(FREQ_KEY, usage)
}

// Remembered skin tone per emoji: 0 = default yellow, 1-5 = light to dark.
export function loadTones(): Record<string, number> {
  return load<Record<string, number>>(TONE_KEY, {})
}

export function saveTones(tones: Record<string, number>) {
  save(TONE_KEY, tones)
}

export function variant(e: Emoji, tone: number): [string, string] {
  return tone > 0 && e.s ? e.s[tone - 1] : [e.c, e.i]
}
