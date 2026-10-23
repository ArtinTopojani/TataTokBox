import { COLORS, type Align, type TextStyle } from '../lib/tiktok'
import { keyboardUrl } from '../lib/emoji'
import { AlignIcon, StyleIcon } from './icons'

type Props = {
  colorIndex: number
  onColor: (index: number) => void
  colorsOpen: boolean
  onToggleColors: () => void
  textStyle: TextStyle
  onCycleStyle: () => void
  align: Align
  onCycleAlign: () => void
  onShowEmoji?: () => void // touch, while the system keyboard is up
}

const STYLE_LABEL: Record<TextStyle, string> = {
  solid: 'Solid background',
  soft: 'See-through background',
  plain: 'No background',
  outline: 'Outline',
}

// The row TikTok shows right above the keyboard while editing text.
export function ToolRow(p: Props) {
  return (
    <div className="tools" onMouseDown={(e) => e.preventDefault()}>
      <button type="button" className="tool" aria-label="Colors" aria-pressed={p.colorsOpen} onClick={p.onToggleColors}>
        <span className={`wheel${p.colorsOpen ? ' open' : ''}`} />
      </button>
      <button type="button" className="tool" aria-label={`Text style: ${STYLE_LABEL[p.textStyle]}`} onClick={p.onCycleStyle}>
        <StyleIcon style={p.textStyle} />
      </button>
      <button type="button" className="tool" aria-label={`Alignment: ${p.align}`} onClick={p.onCycleAlign}>
        <AlignIcon align={p.align} />
      </button>
      {p.onShowEmoji && (
        <button type="button" className="tool tool-emoji" aria-label="Emoji keyboard" onClick={p.onShowEmoji}>
          <img src={keyboardUrl('1f600')} alt="" />
        </button>
      )}
      <div className="tools-sep" />
      {p.colorsOpen ? (
        <div className="colors" role="radiogroup" aria-label="Color">
          {COLORS.map(([bg], i) => (
            <button
              key={bg}
              type="button"
              role="radio"
              aria-checked={i === p.colorIndex}
              aria-label={bg}
              className={`dot${i === p.colorIndex ? ' on' : ''}`}
              style={{ background: bg }}
              onClick={(e) => {
                p.onColor(i)
                e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
              }}
            />
          ))}
        </div>
      ) : (
        <div className="fonts">
          <button type="button" className="font on" aria-pressed="true">
            Classic
          </button>
        </div>
      )}
    </div>
  )
}
