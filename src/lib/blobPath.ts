// Builds TikTok's text background: one rounded shape per paragraph, where each line
// gets its own width and the steps between lines are joined with a convex corner on
// the wider line and a concave fillet on the narrower one.

export type Bounds = { left: number; top: number; right: number; bottom: number }

type Row = { left: number; right: number; center: number }

export type Geometry = {
  path: string
  bounds: Bounds | null // area covered by the box (or the text when there is no box), in wrapper px
}

type Metrics = {
  lineHeight: number // px
  padX: number
  padY: number
  radius: number
  shiftY: number
}

// One row per line of the inline text span, relative to `origin`. Lines with no visible
// content (empty lines, or lines missing entirely between consecutive <br>s) come back as null.
function measureRows(span: HTMLElement, origin: DOMRect, zoom: number, lineHeight: number, shiftY: number): (Row | null)[] {
  const local = (r: DOMRect) => ({
    left: (r.left - origin.left) / zoom,
    right: (r.right - origin.left) / zoom,
    center: ((r.top + r.bottom) / 2 - origin.top) / zoom,
  })

  // Vertical positions: the span's own fragments, one per line, all the same height.
  const rows: Row[] = []
  const fragments = [...span.getClientRects()].filter((r) => r.height > 0).map(local)
  for (const r of fragments.sort((a, b) => a.center - b.center)) {
    const last = rows[rows.length - 1]
    if (!last || Math.abs(r.center - last.center) >= lineHeight / 2) {
      rows.push({ left: Infinity, right: -Infinity, center: r.center })
    }
  }

  // Horizontal extent: only words and emoji. Fragments also include the space that hangs
  // at the end of a wrapped line, which would make the box lopsided.
  const ink: ReturnType<typeof local>[] = []
  const range = document.createRange()
  const walker = document.createTreeWalker(span, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode as Text
    for (const m of node.data.matchAll(/\S+/g)) {
      range.setStart(node, m.index)
      range.setEnd(node, m.index + m[0].length)
      for (const r of range.getClientRects()) if (r.width > 0) ink.push(local(r))
    }
  }
  for (const img of span.querySelectorAll('img')) ink.push(local(img.getBoundingClientRect()))

  for (const r of ink) {
    let row: Row | undefined
    for (const candidate of rows) {
      if (!row || Math.abs(candidate.center - r.center) < Math.abs(row.center - r.center)) row = candidate
    }
    if (!row) continue
    row.left = Math.min(row.left, r.left)
    row.right = Math.max(row.right, r.right)
  }

  const out: (Row | null)[] = []
  for (const row of rows) {
    const prev = out[out.length - 1]
    if (prev && row.center - prev.center > lineHeight * 1.5) out.push(null)
    out.push(row.right > row.left ? { ...row, center: row.center + shiftY } : null)
  }
  return out
}

function paragraphs(rows: (Row | null)[]): Row[][] {
  const groups: Row[][] = []
  let current: Row[] = []
  for (const row of rows) {
    if (row) current.push(row)
    else if (current.length) {
      groups.push(current)
      current = []
    }
  }
  if (current.length) groups.push(current)
  return groups
}

const f = (n: number) => Math.round(n * 100) / 100

function blobPath(rows: Row[], m: Metrics): string {
  const n = rows.length
  const L = rows.map((r) => r.left - m.padX)
  const R = rows.map((r) => r.right + m.padX)

  // Tiny width differences read as noise; square them off like a single edge.
  const snap = m.radius * 0.6
  for (let j = 1; j < n; j++) {
    if (Math.abs(R[j] - R[j - 1]) < snap) R[j] = R[j - 1] = Math.max(R[j], R[j - 1])
    if (Math.abs(L[j] - L[j - 1]) < snap) L[j] = L[j - 1] = Math.min(L[j], L[j - 1])
  }

  // Horizontal boundaries: halfway between line centers; padY above the first and below the last line.
  const Y = [rows[0].center - m.lineHeight / 2 - m.padY]
  for (let j = 1; j < n; j++) Y.push((rows[j - 1].center + rows[j].center) / 2)
  Y.push(rows[n - 1].center + m.lineHeight / 2 + m.padY)

  const rowH = (j: number) => Y[j + 1] - Y[j]
  const corner = (j: number) => Math.min(m.radius, (R[j] - L[j]) / 2, rowH(j) / 2)
  const step = (j: number, d: number) => Math.min(m.radius, Math.abs(d) / 2, rowH(j - 1) / 2, rowH(j) / 2)

  const top = Y[0]
  const bottom = Y[n]
  const r0 = corner(0)
  const rn = corner(n - 1)
  const p: string[] = []

  p.push(`M${f(L[0] + r0)} ${f(top)}`, `H${f(R[0] - r0)}`, `A${f(r0)} ${f(r0)} 0 0 1 ${f(R[0])} ${f(top + r0)}`)

  // Right edge, top to bottom.
  for (let j = 1; j < n; j++) {
    const d = R[j] - R[j - 1]
    if (Math.abs(d) < 0.5) continue
    const rr = step(j, d)
    const y = Y[j]
    p.push(`V${f(y - rr)}`)
    if (d > 0) {
      p.push(`A${f(rr)} ${f(rr)} 0 0 0 ${f(R[j - 1] + rr)} ${f(y)}`, `H${f(R[j] - rr)}`, `A${f(rr)} ${f(rr)} 0 0 1 ${f(R[j])} ${f(y + rr)}`)
    } else {
      p.push(`A${f(rr)} ${f(rr)} 0 0 1 ${f(R[j - 1] - rr)} ${f(y)}`, `H${f(R[j] + rr)}`, `A${f(rr)} ${f(rr)} 0 0 0 ${f(R[j])} ${f(y + rr)}`)
    }
  }

  p.push(
    `V${f(bottom - rn)}`,
    `A${f(rn)} ${f(rn)} 0 0 1 ${f(R[n - 1] - rn)} ${f(bottom)}`,
    `H${f(L[n - 1] + rn)}`,
    `A${f(rn)} ${f(rn)} 0 0 1 ${f(L[n - 1])} ${f(bottom - rn)}`,
  )

  // Left edge, bottom to top.
  for (let j = n - 1; j >= 1; j--) {
    const d = L[j] - L[j - 1] // > 0: the line above sticks out further left
    if (Math.abs(d) < 0.5) continue
    const rr = step(j, d)
    const y = Y[j]
    p.push(`V${f(y + rr)}`)
    if (d > 0) {
      p.push(`A${f(rr)} ${f(rr)} 0 0 0 ${f(L[j] - rr)} ${f(y)}`, `H${f(L[j - 1] + rr)}`, `A${f(rr)} ${f(rr)} 0 0 1 ${f(L[j - 1])} ${f(y - rr)}`)
    } else {
      p.push(`A${f(rr)} ${f(rr)} 0 0 1 ${f(L[j] + rr)} ${f(y)}`, `H${f(L[j - 1] - rr)}`, `A${f(rr)} ${f(rr)} 0 0 0 ${f(L[j - 1])} ${f(y - rr)}`)
    }
  }

  p.push(`V${f(top + r0)}`, `A${f(r0)} ${f(r0)} 0 0 1 ${f(L[0] + r0)} ${f(top)}`, 'Z')
  return p.join('')
}

export function computeGeometry(span: HTMLElement, wrap: HTMLElement, m: Metrics): Geometry {
  const origin = wrap.getBoundingClientRect()
  // getClientRects is in screen px; undo any CSS transform scaling on an ancestor.
  const zoom = wrap.offsetWidth ? origin.width / wrap.offsetWidth : 1
  const groups = paragraphs(measureRows(span, origin, zoom, m.lineHeight, m.shiftY))
  if (!groups.length) return { path: '', bounds: null }

  const bounds: Bounds = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity }
  for (const g of groups) {
    for (const r of g) {
      bounds.left = Math.min(bounds.left, r.left - m.padX)
      bounds.right = Math.max(bounds.right, r.right + m.padX)
    }
    bounds.top = Math.min(bounds.top, g[0].center - m.lineHeight / 2 - m.padY)
    bounds.bottom = Math.max(bounds.bottom, g[g.length - 1].center + m.lineHeight / 2 + m.padY)
  }
  return { path: groups.map((g) => blobPath(g, m)).join(''), bounds }
}
