import { useCallback, useEffect, useRef } from 'react'
import { emojiHtml, recordUse } from '../lib/emoji'

// Remembers where the caret was in the editor, so tapping the emoji keyboard
// (or typing in its search field) inserts at the right spot.
export function useEditor(getEditor: () => HTMLElement | null) {
  const saved = useRef<Range | null>(null)

  useEffect(() => {
    const onSelectionChange = () => {
      const el = getEditor()
      const sel = window.getSelection()
      if (el && sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
        saved.current = sel.getRangeAt(0).cloneRange()
      }
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
  }, [getEditor])

  const restore = useCallback(() => {
    const el = getEditor()
    if (!el) return null
    el.focus({ preventScroll: true })
    let range = saved.current
    if (!range || !el.contains(range.startContainer)) {
      range = document.createRange()
      range.selectNodeContents(el)
      range.collapse(false)
    }
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    return el
  }, [getEditor])

  const insertEmoji = useCallback(
    (char: string, image: string) => {
      const el = restore()
      if (!el) return
      // execCommand keeps the browser's undo stack working; fall back to a plain DOM insert.
      if (!document.execCommand('insertHTML', false, emojiHtml(char, image))) {
        const sel = window.getSelection()!
        const range = sel.getRangeAt(0)
        range.deleteContents()
        const tpl = document.createElement('template')
        tpl.innerHTML = emojiHtml(char, image)
        const img = tpl.content.firstChild!
        range.insertNode(img)
        range.setStartAfter(img)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
        el.dispatchEvent(new Event('input', { bubbles: true }))
      }
      recordUse(char)
    },
    [restore],
  )

  const deleteBackward = useCallback(() => {
    if (restore()) document.execCommand('delete')
  }, [restore])

  return { insertEmoji, deleteBackward }
}
