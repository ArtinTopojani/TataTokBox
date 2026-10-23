import { domToCanvas } from 'modern-screenshot'
import type { Bounds } from './blobPath'

// Renders the text box to a transparent PNG, cropped to the box plus a small margin.
export async function renderPng(wrap: HTMLElement, bounds: Bounds | null, scale: number, margin: number): Promise<Blob> {
  await document.fonts.ready
  await Promise.all([...wrap.querySelectorAll('img')].map((img) => img.decode().catch(() => undefined)))

  const canvas = await domToCanvas(wrap, {
    scale,
    backgroundColor: null,
    onCloneNode: (cloned) => {
      if (!(cloned instanceof HTMLElement)) return
      for (const el of cloned.querySelectorAll('[contenteditable]')) el.removeAttribute('contenteditable')
    },
  })

  const k = canvas.width / wrap.offsetWidth
  const b = bounds ?? { left: 0, top: 0, right: wrap.offsetWidth, bottom: wrap.offsetHeight }
  const sx = Math.max(0, Math.floor((b.left - margin) * k))
  const sy = Math.max(0, Math.floor((b.top - margin) * k))
  const sw = Math.min(canvas.width, Math.ceil((b.right + margin) * k)) - sx
  const sh = Math.min(canvas.height, Math.ceil((b.bottom + margin) * k)) - sy

  const out = document.createElement('canvas')
  out.width = Math.max(1, sw)
  out.height = Math.max(1, sh)
  out.getContext('2d')!.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh)

  return new Promise((resolve, reject) =>
    out.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png'),
  )
}

const isTouch = () => matchMedia('(pointer: coarse)').matches

// On phones the share sheet offers "Save Image" (Photos); elsewhere it's a normal download.
export async function saveBlob(blob: Blob, filename: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], filename, { type: 'image/png' })
  if (isTouch() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return 'cancelled'
      // NotAllowedError (gesture expired) etc.: fall through to a download.
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'downloaded'
}

// The promise goes straight into ClipboardItem so Safari keeps the user gesture.
export async function copyPng(blob: Promise<Blob>) {
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}
