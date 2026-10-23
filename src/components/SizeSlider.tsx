import { useRef } from 'react'
import { SIZE_MAX, SIZE_MIN } from '../lib/tiktok'

type Props = { value: number; onChange: (value: number) => void }

const clamp = (n: number) => Math.min(SIZE_MAX, Math.max(SIZE_MIN, n))

// TikTok's vertical wedge slider on the left edge of the editor.
export function SizeSlider({ value, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const setFromPointer = (clientY: number) => {
    const r = ref.current!.getBoundingClientRect()
    const t = 1 - (clientY - r.top) / r.height
    onChange(clamp(Math.round(SIZE_MIN + t * (SIZE_MAX - SIZE_MIN))))
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 6, PageDown: -6 }[e.key]
    if (step) onChange(clamp(value + step))
    else if (e.key === 'Home') onChange(SIZE_MIN)
    else if (e.key === 'End') onChange(SIZE_MAX)
    else return
    e.preventDefault()
  }

  const pct = (value - SIZE_MIN) / (SIZE_MAX - SIZE_MIN)

  return (
    <div
      ref={ref}
      className="size"
      role="slider"
      tabIndex={0}
      aria-label="Text size"
      aria-orientation="vertical"
      aria-valuemin={SIZE_MIN}
      aria-valuemax={SIZE_MAX}
      aria-valuenow={value}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => {
        e.preventDefault() // keep the caret in the text box
        e.currentTarget.setPointerCapture(e.pointerId)
        dragging.current = true
        setFromPointer(e.clientY)
      }}
      onPointerMove={(e) => dragging.current && setFromPointer(e.clientY)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <div className="size-track" />
      <div className="size-thumb" style={{ top: `${(1 - pct) * 100}%` }} />
    </div>
  )
}
