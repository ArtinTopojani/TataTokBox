import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from 'react'
import { computeGeometry, type Geometry } from '../lib/blobPath'
import { replaceNativeEmoji, sanitize } from '../lib/emoji'
import { renderPng } from '../lib/exportPng'
import { BOX, COLORS, DEFAULT_TEXT, EXPORT_SCALE, FONT_FAMILY, FONT_WEIGHT, type Align, type TextStyle } from '../lib/tiktok'

export type TextBoxHandle = {
  editor: HTMLSpanElement | null
  render: () => Promise<Blob>
  reset: () => void
  focusEnd: () => void
}

type Props = {
  ref: Ref<TextBoxHandle>
  fontSize: number
  colorIndex: number
  textStyle: TextStyle
  align: Align
  emojiKeyboard: boolean // true: our keyboard is up, so keep the system keyboard down
}

// Extra transparent space around the box inside the wrapper (em), so the crop never clips antialiasing.
const MARGIN = 0.3

function placeCaretAtEnd(el: HTMLElement) {
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(false)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

export function TextBox({ ref, fontSize, colorIndex, textStyle, align, emojiKeyboard }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const spanRef = useRef<HTMLSpanElement>(null)
  const [geo, setGeo] = useState<Geometry>({ path: '', bounds: null })
  const geoRef = useRef(geo)
  const [version, setVersion] = useState(0)

  const measure = useCallback(() => {
    const span = spanRef.current
    const wrap = wrapRef.current
    if (!span || !wrap) return
    const next = computeGeometry(span, wrap, {
      lineHeight: BOX.lineHeight * fontSize,
      padX: BOX.padX * fontSize,
      padY: BOX.padY * fontSize,
      radius: BOX.radius * fontSize,
      shiftY: BOX.shiftY * fontSize,
    })
    geoRef.current = next
    setGeo((prev) => (prev.path === next.path ? prev : next))
  }, [fontSize])

  useLayoutEffect(measure, [measure, align, textStyle, version])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    document.fonts.ready.then(measure)
    document.fonts.addEventListener('loadingdone', measure)
    return () => {
      ro.disconnect()
      document.fonts.removeEventListener('loadingdone', measure)
    }
  }, [measure])

  useEffect(() => {
    const span = spanRef.current
    if (!span) return
    span.textContent = DEFAULT_TEXT
    span.focus({ preventScroll: true })
    placeCaretAtEnd(span)
    setVersion((v) => v + 1)
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      get editor() {
        return spanRef.current
      },
      render: () => renderPng(wrapRef.current!, geoRef.current.bounds, EXPORT_SCALE, MARGIN * 0.6 * fontSize),
      reset: () => {
        const span = spanRef.current
        if (!span) return
        span.textContent = DEFAULT_TEXT
        span.focus({ preventScroll: true })
        placeCaretAtEnd(span)
        setVersion((v) => v + 1)
      },
      focusEnd: () => {
        const span = spanRef.current
        if (!span) return
        span.focus({ preventScroll: true })
        placeCaretAtEnd(span)
      },
    }),
    [fontSize],
  )

  const handleInput = (e?: React.FormEvent) => {
    const span = spanRef.current
    if (!span) return
    // Don't touch the DOM mid-composition (IME / predictive keyboards); compositionend comes back here.
    if (e && (e.nativeEvent as InputEvent).isComposing) return
    if (sanitize(span)) placeCaretAtEnd(span)
    replaceNativeEmoji(span)
    setVersion((v) => v + 1)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      document.execCommand('insertLineBreak')
    }
  }

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    if (text) document.execCommand('insertText', false, text)
  }

  const [bg, fg] = COLORS[colorIndex]
  const hasBox = textStyle === 'solid' || textStyle === 'soft'
  const textColor = textStyle === 'solid' || textStyle === 'soft' ? fg : bg

  return (
    <div
      ref={wrapRef}
      className="tt-wrap"
      style={{
        fontSize,
        fontFamily: FONT_FAMILY,
        fontWeight: FONT_WEIGHT,
        lineHeight: BOX.lineHeight,
        textAlign: align,
        padding: `${BOX.padY + MARGIN}em ${BOX.padX + MARGIN}em`,
      }}
    >
      {hasBox && geo.path && (
        <svg className="tt-bg" aria-hidden="true">
          <path d={geo.path} fill={bg} fillOpacity={textStyle === 'soft' ? 0.5 : 1} />
        </svg>
      )}
      <span
        ref={spanRef}
        className={`tt-text${textStyle === 'outline' ? ' tt-outline' : ''}`}
        style={{ color: textColor, caretColor: textColor, ['--stroke' as string]: fg }}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="sentences"
        inputMode={emojiKeyboard ? 'none' : 'text'}
        role="textbox"
        aria-label="Text box text"
        aria-multiline="true"
        onInput={handleInput}
        onCompositionEnd={() => handleInput()}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onDrop={(e) => e.preventDefault()}
      />
    </div>
  )
}
