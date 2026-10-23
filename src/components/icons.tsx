import type { Align, TextStyle } from '../lib/tiktok'

const line = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

// iOS emoji keyboard category icons.
export function CategoryIcon({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...line}>
      {id === 'recent' && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </>
      )}
      {id === 'people' && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M8.3 14.2c.9 1.5 2.2 2.2 3.7 2.2s2.8-.7 3.7-2.2" />
          <circle cx="9.2" cy="9.8" r=".9" fill="currentColor" stroke="none" />
          <circle cx="14.8" cy="9.8" r=".9" fill="currentColor" stroke="none" />
        </>
      )}
      {id === 'nature' && (
        <>
          <circle cx="6.8" cy="7" r="2.4" />
          <circle cx="17.2" cy="7" r="2.4" />
          <path d="M5.6 13.4c0-3.8 2.9-6.2 6.4-6.2s6.4 2.4 6.4 6.2c0 3.4-2.8 5.6-6.4 5.6s-6.4-2.2-6.4-5.6Z" />
          <path d="M10.6 14.6c.4.5.9.7 1.4.7s1-.2 1.4-.7" />
          <circle cx="9.6" cy="12" r=".8" fill="currentColor" stroke="none" />
          <circle cx="14.4" cy="12" r=".8" fill="currentColor" stroke="none" />
        </>
      )}
      {id === 'food' && (
        <>
          <path d="M4.5 11.5C4.5 7.6 7.8 5 12 5s7.5 2.6 7.5 6.5Z" />
          <path d="M4 14.5h16" />
          <path d="M5 17.5h14c0 .9-.7 1.5-1.5 1.5h-11c-.8 0-1.5-.6-1.5-1.5Z" />
        </>
      )}
      {id === 'activity' && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.6 12h16.8M12 3.5v17" />
          <path d="M6 6c1.8 1.6 2.8 3.7 2.8 6S7.8 16.4 6 18M18 6c-1.8 1.6-2.8 3.7-2.8 6s1 4.4 2.8 6" />
        </>
      )}
      {id === 'travel' && (
        <>
          <path d="M4 15.5v-3l1.8-4.6c.3-.8 1-1.4 1.9-1.4h8.6c.9 0 1.6.6 1.9 1.4L20 12.5v3c0 .6-.4 1-1 1H5c-.6 0-1-.4-1-1Z" />
          <path d="M4.5 12.5h15" />
          <path d="M6.5 16.5v1.5M17.5 16.5v1.5" />
          <circle cx="7.5" cy="14.3" r=".8" fill="currentColor" stroke="none" />
          <circle cx="16.5" cy="14.3" r=".8" fill="currentColor" stroke="none" />
        </>
      )}
      {id === 'objects' && (
        <>
          <path d="M9 17.5h6M10 20.5h4" />
          <path d="M9.2 14.8C7.4 13.6 6.3 11.7 6.3 9.6 6.3 6.3 8.9 3.8 12 3.8s5.7 2.5 5.7 5.8c0 2.1-1.1 4-2.9 5.2v1.2H9.2Z" />
        </>
      )}
      {id === 'symbols' && (
        <text x="12" y="16.4" textAnchor="middle" fontSize="12.5" fontWeight="600" fill="currentColor" stroke="none" fontFamily="system-ui, sans-serif">
          &amp;%
        </text>
      )}
      {id === 'flags' && (
        <>
          <path d="M5.5 21V4" />
          <path d="M5.5 4.8c2.2-1.2 4.2-1.2 6.4 0s4.2 1.2 6.6 0v8.6c-2.4 1.2-4.4 1.2-6.6 0s-4.2-1.2-6.4 0" />
        </>
      )}
    </svg>
  )
}

export function DeleteIcon() {
  return (
    <svg viewBox="0 0 28 22" width="27" height="21" aria-hidden="true" {...line} strokeWidth={1.6}>
      <path d="M9.2 2.5h14.3c1.1 0 2 .9 2 2v13c0 1.1-.9 2-2 2H9.2c-.5 0-1-.2-1.4-.6L2.6 12.4c-.7-.8-.7-2 0-2.8l5.2-6.5c.4-.4.9-.6 1.4-.6Z" />
      <path d="m12.5 7.5 7 7M19.5 7.5l-7 7" />
    </svg>
  )
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" {...line} strokeWidth={2.2}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </svg>
  )
}

// The "A" button shows the current text style, like TikTok.
export function StyleIcon({ style }: { style: TextStyle }) {
  const letter = (fill: string, stroke?: string) => (
    <text
      x="12"
      y="17.2"
      textAnchor="middle"
      fontSize="15"
      fontWeight="800"
      fontFamily="'TikTok Sans Variable', system-ui, sans-serif"
      fill={fill}
      stroke={stroke}
      strokeWidth={stroke ? 1.4 : undefined}
    >
      A
    </text>
  )
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      {style === 'solid' && (
        <>
          <rect x="2" y="2" width="20" height="20" rx="5" fill="#fff" />
          {letter('#000')}
        </>
      )}
      {style === 'soft' && (
        <>
          <rect x="2" y="2" width="20" height="20" rx="5" fill="#fff" fillOpacity=".45" />
          {letter('#fff')}
        </>
      )}
      {style === 'plain' && (
        <>
          <rect x="2.75" y="2.75" width="18.5" height="18.5" rx="4.5" fill="none" stroke="#fff" strokeWidth="1.5" />
          {letter('#fff')}
        </>
      )}
      {style === 'outline' && (
        <>
          <rect x="2.75" y="2.75" width="18.5" height="18.5" rx="4.5" fill="none" stroke="#fff" strokeWidth="1.5" />
          {letter('none', '#fff')}
        </>
      )}
    </svg>
  )
}

export function AlignIcon({ align }: { align: Align }) {
  const rows = [16, 10, 16, 10]
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...line} strokeWidth={2}>
      {rows.map((w, i) => {
        const y = 6 + i * 4
        const x = align === 'left' ? 4 : align === 'right' ? 20 - w : 12 - w / 2
        return <path key={i} d={`M${x} ${y}h${w}`} />
      })}
    </svg>
  )
}

export function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...line} strokeWidth={2}>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
      <path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
    </svg>
  )
}

export function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...line} strokeWidth={2}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m4 17 4.5-4.5 3.5 3.5 2.5-2.5L20 19" />
    </svg>
  )
}

export function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...line} strokeWidth={2}>
      <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" />
    </svg>
  )
}

export function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  )
}
