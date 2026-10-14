# Changelog

All notable changes to Timely are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] - 2026-10-14

### Added
- Liquid Glass style: the Timer / Stopwatch switcher now has a draggable glass thumb with press magnify, velocity stretch and a gooey trailing blob (SVG goo filter). Tap, drag, or use the arrow keys.
- Settings → Appearance → **Liquid Glass style** toggle (on by default); turning it off restores the solid pill. Saved between visits and applied before first paint.
- Respects reduced motion (no stretch), reduced transparency (solid lens) and forced colors.

### Changed
- Service worker cache bumped to `timely-v3`.

## [0.1.0] - 2026-10-13

A ground-up refresh focused on speed, accessibility and a calmer, Apple-style look.

### Changed
- Redesigned UI: minimal layout, system fonts (SF Pro on Apple devices), Liquid Glass-style surfaces, rounded outline icons, no pulsing glows.
- Light and dark appearance now follow the system by default, with an Auto / Light / Dark override.
- The 20 color themes are now accent colors on neutral system surfaces, so text contrast stays high in every theme.
- Settings is a native modal sheet (focus trap, Esc to close) instead of a custom overlay.
- Timer and stopwatch now keep their own state: switching tabs no longer stops or confuses either one.
- Timing is based on timestamps, so it stays accurate in background tabs.
- Timer input accepts `5`, `10`, `500`, `5:30` and `1:05:00`; Up/Down arrows change the length by a minute.
- Custom accent picker uses native range sliders (Hue, Saturation, Brightness) with HEX, RGB, HSL, HSV and CMYK readouts.

### Added
- Keyboard shortcuts: Space (start/pause), R (reset), L (lap), M (switch mode).
- Countdown shown in the browser tab title while a timer or stopwatch runs.
- Lap list shows split and total times.
- Installable web app (manifest, icons) with offline support through a service worker.
- Optional, opt-in Liquid Glass WebGL refraction on the control dock (Settings > Experimental).
- Search and sharing metadata: single title, description, canonical URL, Open Graph and Twitter cards, JSON-LD `WebApplication`, valid `sitemap.xml` and `robots.txt`, and a 404 page.
- Content Security Policy.
- Settings and theme are restored before first paint, with a migration from the previous storage format.

### Fixed
- Accessible names for the play button, sliders and all inputs; all axe-core checks pass in light and dark.
- Duplicate `<title>`, placeholder `og:url`, and malformed `robots.txt` and `sitemap.xml`.
- Broken chime link (403 from Pixabay): the chime is now generated with Web Audio.
- Lint workflow typos (`node-node`, `stylecss`) that made it fail silently.
- Adding time while a timer was running did not extend it correctly.

### Performance
- Page weight on first load drops from about 2.6 MB to about 60 KB: snd-lib (65 KB) and its 908 KB sound sprite are gone, and the 1.6 MB music file now downloads only when you turn music on (and is 50% smaller).
- No render-blocking third-party requests, no web fonts, no layout-shifting JavaScript rendering.
- 180 KB favicon.ico replaced by an SVG favicon and a 5 KB .ico.

### Removed
- snd-lib dependency, the Pixabay chime, the Glow toggle and glow animations, per-preset +/- adjusters, the Download button for custom audio, and custom background/surface/panel/text colors.

## [0.0.1-alpha] - 2026-06-16

Initial pre-release: timer, stopwatch, Pomodoro mode, themes, ambient audio.
