import { createContext, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  SECTIONS,
  frequentEmoji,
  imageFor,
  keyboardUrl,
  loadTones,
  saveTones,
  variant,
  type Emoji,
} from '../lib/emoji'
import { CategoryIcon, DeleteIcon, SearchIcon } from './icons'

type Props = {
  onEmoji: (char: string, image: string) => void
  onDelete: () => void
  onAbc?: () => void // touch devices: switch back to the system keyboard
}

type Item = { key: string; char: string; image: string; entry?: Emoji }

type Observe = (el: Element, show: () => void) => () => void
const LazyContext = createContext<Observe | null>(null)

// Each emoji image loads only when its cell scrolls near the visible part of the keyboard.
const Cell = memo(
  function Cell({ item }: { item: Item }) {
    const observe = useContext(LazyContext)
    const ref = useRef<HTMLButtonElement>(null)
    const [shown, setShown] = useState(false)
    useEffect(() => (observe && ref.current ? observe(ref.current, () => setShown(true)) : undefined), [observe])
    return (
      <button
        ref={ref}
        type="button"
        className="kb-cell"
        data-char={item.char}
        data-image={item.image}
        data-tones={item.entry?.s ? item.entry.c : undefined}
        aria-label={item.char}
      >
        {shown && <img src={keyboardUrl(item.image)} alt="" draggable={false} />}
      </button>
    )
  },
  (a, b) => a.item.char === b.item.char && a.item.image === b.item.image,
)

function Section({ id, name, items, register }: { id: string; name: string; items: Item[]; register: (id: string, el: HTMLElement | null) => void }) {
  return (
    <section className="kb-section" ref={(el) => register(id, el)}>
      <div className="kb-label">{name}</div>
      <div className="kb-grid">
        {items.map((item) => (
          <Cell key={item.key} item={item} />
        ))}
      </div>
    </section>
  )
}

const CATEGORIES = [{ id: 'recent', name: 'Frequently Used' }, ...SECTIONS.map(({ id, name }) => ({ id, name }))]
const byBase = new Map(SECTIONS.flatMap((s) => s.emojis.map((e) => [e.c, e] as const)))

type TonePopover = { entry: Emoji; left: number; top: number }

export function EmojiKeyboard({ onEmoji, onDelete, onAbc }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sectionEls = useRef(new Map<string, HTMLElement>())
  const [query, setQuery] = useState('')
  const [active, setActive] = useState('recent')
  const [tones, setTones] = useState(loadTones)
  const [frequent] = useState(frequentEmoji)
  const [popover, setPopover] = useState<TonePopover | null>(null)

  // --- lazy image loading -------------------------------------------------
  const observer = useRef<IntersectionObserver | null>(null)
  const callbacks = useRef(new Map<Element, () => void>())
  const observe = useCallback<Observe>((el, show) => {
    if (!observer.current) {
      observer.current = new IntersectionObserver(
        (entries) => {
          for (const en of entries) {
            if (!en.isIntersecting) continue
            callbacks.current.get(en.target)?.()
            callbacks.current.delete(en.target)
            observer.current?.unobserve(en.target)
          }
        },
        { root: scrollRef.current, rootMargin: '0px 320px' },
      )
    }
    callbacks.current.set(el, show)
    observer.current.observe(el)
    return () => {
      callbacks.current.delete(el)
      observer.current?.unobserve(el)
    }
  }, [])
  useEffect(() => () => observer.current?.disconnect(), [])

  // --- items --------------------------------------------------------------
  const itemFor = useCallback(
    (e: Emoji): Item => {
      const [char, image] = variant(e, tones[e.c] ?? 0)
      return { key: e.c, char, image, entry: e }
    },
    [tones],
  )

  const sections = useMemo(() => SECTIONS.map((s) => ({ ...s, items: s.emojis.map(itemFor) })), [itemFor])

  const recentItems = useMemo<Item[]>(
    () => frequent.flatMap((c) => {
      const image = imageFor(c)
      return image ? [{ key: c, char: c, image }] : []
    }),
    [frequent],
  )

  const results = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (!terms.length) return null
    const out: Item[] = []
    for (const s of SECTIONS) {
      for (const e of s.emojis) {
        const words = e.k.split(' ')
        if (terms.every((t) => words.some((w) => w.startsWith(t)))) out.push(itemFor(e))
        if (out.length >= 300) return out
      }
    }
    return out
  }, [query, itemFor])

  // --- scrolling ----------------------------------------------------------
  const register = useCallback((id: string, el: HTMLElement | null) => {
    if (el) sectionEls.current.set(id, el)
    else sectionEls.current.delete(id)
  }, [])

  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return
    // Vertical mouse wheels scroll the keyboard sideways, like a trackpad swipe.
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      e.preventDefault()
      scroller.scrollLeft += e.deltaY
    }
    scroller.addEventListener('wheel', onWheel, { passive: false })
    return () => scroller.removeEventListener('wheel', onWheel)
  }, [])

  const frame = useRef(0)
  const onScroll = () => {
    clearPress()
    setPopover(null)
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const x = (scrollRef.current?.scrollLeft ?? 0) + 8
      let current = 'recent'
      for (const { id } of CATEGORIES) {
        const el = sectionEls.current.get(id)
        if (el && el.offsetLeft <= x) current = id
      }
      setActive(current)
    })
  }

  const jump = (id: string) => {
    const go = () => {
      const el = sectionEls.current.get(id)
      scrollRef.current?.scrollTo({ left: el ? el.offsetLeft : 0, behavior: 'smooth' })
    }
    setActive(id)
    if (query) {
      setQuery('')
      requestAnimationFrame(go)
    } else go()
  }

  // --- tap, long-press, skin tones ---------------------------------------
  const pressTimer = useRef(0)
  const pressStart = useRef<{ x: number; y: number } | null>(null)
  const suppressClick = useRef(false)

  function clearPress() {
    clearTimeout(pressTimer.current)
    pressStart.current = null
  }

  const openTones = (cell: HTMLElement) => {
    const entry = byBase.get(cell.dataset.tones ?? '')
    const root = rootRef.current
    if (!entry || !root) return
    const r = cell.getBoundingClientRect()
    const box = root.getBoundingClientRect()
    const width = 6 * 44 + 12
    const left = Math.min(Math.max(6, r.left + r.width / 2 - box.left - width / 2), box.width - width - 6)
    const top = Math.max(4, r.top - box.top - 58)
    setPopover({ entry, left, top })
  }

  const onPointerDown = (e: React.PointerEvent) => {
    const cell = (e.target as Element).closest<HTMLElement>('.kb-cell')
    suppressClick.current = false
    if (!cell || e.button !== 0 || !cell.dataset.tones) return
    pressStart.current = { x: e.clientX, y: e.clientY }
    pressTimer.current = window.setTimeout(() => {
      suppressClick.current = true
      openTones(cell)
    }, 450)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const s = pressStart.current
    if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > 8) clearPress()
  }

  const onClick = (e: React.MouseEvent) => {
    const cell = (e.target as Element).closest<HTMLElement>('.kb-cell')
    if (!cell) return
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    onEmoji(cell.dataset.char!, cell.dataset.image!)
  }

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    const cell = (e.target as Element).closest<HTMLElement>('.kb-cell')
    if (cell?.dataset.tones) {
      clearPress()
      openTones(cell)
    }
  }

  const pickTone = (entry: Emoji, tone: number) => {
    const next = { ...tones, [entry.c]: tone }
    setTones(next)
    saveTones(next)
    const [char, image] = variant(entry, tone)
    onEmoji(char, image)
    setPopover(null)
  }

  useEffect(() => {
    if (!popover) return
    const close = (e: PointerEvent) => {
      if (!(e.target as Element).closest('.kb-tones')) setPopover(null)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [popover])

  // --- delete key (hold to repeat) ---------------------------------------
  const repeat = useRef<{ timeout: number; interval: number }>({ timeout: 0, interval: 0 })
  const stopDelete = () => {
    clearTimeout(repeat.current.timeout)
    clearInterval(repeat.current.interval)
  }
  const startDelete = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    stopDelete()
    onDelete()
    repeat.current.timeout = window.setTimeout(() => {
      repeat.current.interval = window.setInterval(onDelete, 70)
    }, 450)
  }
  useEffect(() => stopDelete, [])

  return (
    <div
      ref={rootRef}
      className="kb"
      // Keep focus (and the caret) in the text box while tapping keys.
      onMouseDown={(e) => {
        if (!(e.target as Element).closest('input')) e.preventDefault()
      }}
    >
      <label className="kb-search">
        <SearchIcon />
        <input
          type="search"
          placeholder="Search Emoji"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            scrollRef.current?.scrollTo({ left: 0 })
          }}
          enterKeyHint="search"
          autoComplete="off"
        />
      </label>

      <LazyContext.Provider value={observe}>
        <div
          ref={scrollRef}
          className="kb-scroll"
          onScroll={onScroll}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={clearPress}
          onPointerCancel={clearPress}
          onPointerLeave={clearPress}
          onClick={onClick}
          onContextMenu={onContextMenu}
        >
          {results ? (
            results.length ? (
              <Section id="search" name="Search Results" items={results} register={register} />
            ) : (
              <div className="kb-empty">No Emoji Found</div>
            )
          ) : (
            <>
              <Section id="recent" name="Frequently Used" items={recentItems} register={register} />
              {sections.map((s) => (
                <Section key={s.id} id={s.id} name={s.name} items={s.items} register={register} />
              ))}
            </>
          )}
        </div>
      </LazyContext.Provider>

      <div className="kb-bar">
        {onAbc && (
          <button type="button" className="kb-key kb-abc" onClick={onAbc}>
            ABC
          </button>
        )}
        <div className="kb-cats" role="tablist" aria-label="Emoji categories">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={!results && active === c.id}
              aria-label={c.name}
              title={c.name}
              className={`kb-cat${!results && active === c.id ? ' on' : ''}`}
              onClick={() => jump(c.id)}
            >
              <CategoryIcon id={c.id} />
            </button>
          ))}
        </div>
        <button
          type="button"
          className="kb-key kb-del"
          aria-label="Delete"
          onPointerDown={startDelete}
          onPointerUp={stopDelete}
          onPointerLeave={stopDelete}
          onPointerCancel={stopDelete}
          onContextMenu={(e) => e.preventDefault()}
          onClick={(e) => {
            if (e.detail === 0) onDelete() // keyboard activation
          }}
        >
          <DeleteIcon />
        </button>
      </div>

      {popover && (
        <div className="kb-tones" role="dialog" aria-label="Skin tone" style={{ left: popover.left, top: popover.top }}>
          {[0, 1, 2, 3, 4, 5].map((t) => {
            const [char, image] = variant(popover.entry, t)
            return (
              <button
                key={t}
                type="button"
                className={`kb-tone${(tones[popover.entry.c] ?? 0) === t ? ' on' : ''}`}
                aria-label={char}
                onClick={() => pickTone(popover.entry, t)}
              >
                <img src={keyboardUrl(image)} alt="" draggable={false} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
