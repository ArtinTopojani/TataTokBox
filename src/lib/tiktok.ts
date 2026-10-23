// TikTok's text editor palette: [box color, text color].
export const COLORS: readonly [string, string][] = [
  ['#FFFFFF', '#000000'],
  ['#000000', '#FFFFFF'],
  ['#EA4040', '#FFFFFF'],
  ['#FF933D', '#FFFFFF'],
  ['#F2CD46', '#864918'],
  ['#78C25E', '#FFFFFF'],
  ['#00B09B', '#FFFFFF'],
  ['#00A8CD', '#FFFFFF'],
  ['#3596F0', '#FFFFFF'],
  ['#2444B3', '#FFFFFF'],
  ['#5756D5', '#FFFFFF'],
  ['#9966F1', '#FFFFFF'],
  ['#C92EFF', '#FFFFFF'],
  ['#D26793', '#F8D7E9'],
  ['#412E28', '#FFFFFF'],
  ['#B2533E', '#FFFFFF'],
  ['#A4895B', '#FFFFFF'],
  ['#32523C', '#FFFFFF'],
  ['#2F698D', '#FFFFFF'],
  ['#213555', '#FFFFFF'],
  ['#8CDDEB', '#115B68'],
  ['#94ABFF', '#213479'],
  ['#B4AFFF', '#412FB1'],
  ['#FAC3FF', '#922AAB'],
  ['#FFB5B0', '#DE3A33'],
  ['#FFF7A6', '#AF6429'],
  ['#92979E', '#FFFFFF'],
  ['#333333', '#FFFFFF'],
]

// The "A" button cycles through these, like TikTok.
export const STYLES = ['solid', 'soft', 'plain', 'outline'] as const
export type TextStyle = (typeof STYLES)[number]

export const ALIGNS = ['center', 'left', 'right'] as const
export type Align = (typeof ALIGNS)[number]

export const FONT_FAMILY = "'TikTok Sans Variable', 'TikTok Sans', system-ui, sans-serif"
export const FONT_WEIGHT = 700

export const SIZE_MIN = 14
export const SIZE_MAX = 64
export const SIZE_DEFAULT = 28

// Box geometry, in em so everything scales with the size slider.
export const BOX = {
  lineHeight: 1.22,
  padX: 0.36,
  padY: 0.1,
  radius: 0.26,
  // The font's content box sits above the visual middle of the letters; nudge the box down to center it.
  shiftY: 0.09,
}

export const DEFAULT_TEXT = 'Create your custom text box'
export const EXPORT_SCALE = 4
