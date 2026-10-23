import { realpathSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Use the real on-disk path as the root. On Windows, redirected folders (e.g. under an
  // MSIX app's AppData) otherwise resolve outside the root and Vite refuses to serve them.
  root: realpathSync.native(process.cwd()),
  // Served from https://artintopojani.github.io/TataTokBox/ on GitHub Pages.
  base: process.env.GITHUB_PAGES ? '/TataTokBox/' : '/',
  plugins: [react()],
})
