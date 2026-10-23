import { useCallback, useEffect, useRef, useState } from 'react'
import { EmojiKeyboard } from './components/EmojiKeyboard'
import { CopyIcon, GitHubIcon, ImageIcon } from './components/icons'
import { SizeSlider } from './components/SizeSlider'
import { TextBox, type TextBoxHandle } from './components/TextBox'
import { ToolRow } from './components/ToolRow'
import { useEditor } from './hooks/useEditor'
import { copyPng, saveBlob } from './lib/exportPng'
import { GITHUB_URL, SITE_NAME } from './lib/site'
import { ALIGNS, SIZE_DEFAULT, STYLES, type Align, type TextStyle } from './lib/tiktok'

const next = <T,>(list: readonly T[], current: T) => list[(list.indexOf(current) + 1) % list.length]

export default function App() {
  const boxRef = useRef<TextBoxHandle>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [fontSize, setFontSize] = useState(SIZE_DEFAULT)
  const [colorIndex, setColorIndex] = useState(0)
  const [textStyle, setTextStyle] = useState<TextStyle>('solid')
  const [align, setAlign] = useState<Align>('center')
  const [colorsOpen, setColorsOpen] = useState(false)
  const [touch] = useState(() => matchMedia('(pointer: coarse)').matches)
  const [emojiKeyboard, setEmojiKeyboard] = useState(true)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [background, setBackground] = useState<string | null>(null)

  const getEditor = useCallback(() => boxRef.current?.editor ?? null, [])
  const { insertEmoji, deleteBackward } = useEditor(getEditor)

  const toastTimer = useRef(0)
  const showToast = (message: string) => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 1800)
  }

  const download = async () => {
    if (busy || !boxRef.current) return
    setBusy(true)
    try {
      const blob = await boxRef.current.render()
      const result = await saveBlob(blob, `tatatokbox-${Date.now()}.png`)
      if (result !== 'cancelled') showToast(result === 'shared' ? 'Saved' : 'Downloaded')
    } catch (err) {
      console.error(err)
      showToast('Download failed, try again')
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    if (!boxRef.current) return
    try {
      await copyPng(boxRef.current.render())
      showToast('Copied to clipboard')
    } catch (err) {
      console.error(err)
      showToast("Couldn't copy, use Download")
    }
  }

  const reset = () => {
    boxRef.current?.reset()
    setFontSize(SIZE_DEFAULT)
    setColorIndex(0)
    setTextStyle('solid')
    setAlign('center')
    setColorsOpen(false)
  }

  // Phones: swap between our emoji keyboard and the system keyboard. iOS only raises the
  // keyboard for a focus() inside the tap itself, so the attribute is flipped synchronously.
  const switchKeyboard = (toEmoji: boolean) => {
    const editor = getEditor()
    if (editor) {
      editor.inputMode = toEmoji ? 'none' : 'text'
      editor.blur()
      editor.focus({ preventScroll: true })
    }
    setEmojiKeyboard(toEmoji)
  }

  const pickBackground = (file: File | undefined) => {
    if (!file) return
    setBackground((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const showOurKeyboard = !touch || emojiKeyboard

  return (
    <div className="page">
      <header className="brand">
        <h1>
          <img src="/logo.png" alt={SITE_NAME} width="148" height="88" />
        </h1>
        <p>TikTok-style text boxes with iOS emoji. Download as a transparent PNG and drop it on any video.</p>
      </header>

      <main className="phone">
        <div
          className="stage"
          style={background ? { backgroundImage: `url(${background})` } : undefined}
          onPointerDown={(e) => {
            // Tapping empty space puts the caret back at the end of the text, like TikTok.
            if ((e.target as Element).closest('.tt-wrap, button, .size, .tools')) return
            e.preventDefault()
            boxRef.current?.focusEnd()
          }}
        >
          <div className="stage-dim" />

          <div className="topbar" onMouseDown={(e) => e.preventDefault()}>
            <button type="button" className="tb-text" onClick={reset}>
              Reset
            </button>
            <div className="tb-right">
              <button type="button" className="tb-icon" aria-label="Preview on your own picture" title="Preview on your own picture" onClick={() => fileRef.current?.click()}>
                <ImageIcon />
              </button>
              <button type="button" className="tb-icon" aria-label="Copy image" title="Copy image" onClick={copy}>
                <CopyIcon />
              </button>
              <button type="button" className="tb-done" onClick={download} disabled={busy}>
                {busy ? 'Saving…' : 'Download'}
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickBackground(e.target.files?.[0])} />
          </div>

          <SizeSlider value={fontSize} onChange={setFontSize} />

          <div className="stage-scroll">
            <TextBox ref={boxRef} fontSize={fontSize} colorIndex={colorIndex} textStyle={textStyle} align={align} emojiKeyboard={touch && emojiKeyboard} />
          </div>

          <ToolRow
            colorIndex={colorIndex}
            onColor={setColorIndex}
            colorsOpen={colorsOpen}
            onToggleColors={() => setColorsOpen((o) => !o)}
            textStyle={textStyle}
            onCycleStyle={() => setTextStyle((s) => next(STYLES, s))}
            align={align}
            onCycleAlign={() => setAlign((a) => next(ALIGNS, a))}
            onShowEmoji={touch && !emojiKeyboard ? () => switchKeyboard(true) : undefined}
          />

          {toast && (
            <div className="toast" role="status">
              {toast}
            </div>
          )}
        </div>

        {showOurKeyboard && (
          <EmojiKeyboard onEmoji={insertEmoji} onDelete={deleteBackward} onAbc={touch ? () => switchKeyboard(false) : undefined} />
        )}
      </main>

      <footer className="footer">
        <p className="note">The background picture is only a preview. It isn't included in the download.</p>
        <a className="github" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          <GitHubIcon />
          {GITHUB_URL.replace(/^https?:\/\//, '')}
        </a>
      </footer>
    </div>
  )
}
