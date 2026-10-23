<p align="center">
  <img src="public/logo.png" alt="TataTokBox" width="220" />
</p>

<p align="center">
  <strong>TikTok-style text boxes in seconds. No video editor needed.</strong>
</p>

---

## Why TataTokBox?

If you edit videos, you know the routine: you want that classic TikTok text box (white box, bold black text, rounded corners), so you open the TikTok app, type it, screen-record or screenshot it, crop it, and carry it over to your editor. Or you rebuild it by hand in Premiere, CapCut or After Effects, and it never looks quite right.

**TataTokBox skips all of that.** Type your text, tap some emoji, and download a transparent PNG that looks exactly like TikTok's. Drop it on your timeline in any editor and you're done.

## Who it's for

- **Video editors** who need TikTok-native captions on client videos
- **Content creators** posting the same clip to TikTok, Reels and Shorts
- **UGC and ad makers** who want overlays that look native to the platform
- **Anyone** who doesn't want to open a video editor just to make one text box

## Features

- **Looks like TikTok:** TikTok Sans (TikTok's own "Classic" font), the same rounded box shape, and smooth inner curves where lines change width
- **iOS emoji keyboard:** real Apple emoji on every device, including Windows and Android. Frequently Used, search, categories and skin tones, just like an iPhone
- **TikTok's 28 colors** and all four text styles: solid box, see-through box, no box, and outline
- **Size slider and alignment:** left, center or right
- **Transparent PNG export** at 4× resolution, cropped tight to the box, sharp on 1080p and 4K timelines
- **Copy to clipboard** to paste straight into your editor
- **Preview on your own picture** to check the look over a frame of your video (the picture is never included in the download)
- **Works on phones:** on mobile, Download opens the share sheet so you can save to Photos

## How to use it

1. Type your text. Press Enter for a new line, or leave an empty line to split it into separate boxes.
2. Add emoji from the keyboard. Long-press (or right-click) an emoji for skin tones.
3. Pick a color, a style (the **A** button) and an alignment, and set the size with the slider on the left.
4. Hit **Download** and drop the PNG onto your video in CapCut, Premiere Pro, Final Cut, DaVinci Resolve, After Effects or anything else.

## Run it locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

To build a static site you can host anywhere (Vercel, Netlify, GitHub Pages):

```bash
npm run build
```

The output goes to `dist/`.

## Built with

- [React](https://react.dev) + [Vite](https://vite.dev) + TypeScript
- [TikTok Sans](https://fonts.google.com/specimen/TikTok+Sans) via `@fontsource-variable/tiktok-sans` (SIL Open Font License)
- [emoji-datasource](https://github.com/iamcal/emoji-data) for Apple emoji images, served by [jsDelivr](https://www.jsdelivr.com)
- [modern-screenshot](https://github.com/qq15725/modern-screenshot) for PNG export

## Note on emoji

Apple's emoji artwork is copyrighted by Apple Inc. If you plan to use TataTokBox commercially, consider switching to an openly licensed set such as Twemoji or Noto Emoji. It's a two-line change in `src/lib/emoji.ts`.

---

<p align="center">Made by <a href="https://github.com/ArtinTopojani">ArtinTopojani</a></p>
