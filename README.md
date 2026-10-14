<div align="center">

<img src="assets/favicon.ico" width="96" height="96" alt="Timely app icon">

# Timely

**A free, minimal timer, stopwatch and Pomodoro study timer for the web.**<br>
Fast, accessible and installable. No sign-up, no tracking, no dependencies.

[**Open Timely →**](https://theshadowninjagmd.github.io/TimelyV2.app/)

[![Website](https://img.shields.io/website?url=https%3A%2F%2Ftheshadowninjagmd.github.io%2FTimely.app%2F&label=live)](https://theshadowninjagmd.github.io/Timely.app/)
[![License](https://img.shields.io/github/license/TheShadowNinjaGMD/Timely.app)](LICENSE)
[![Stars](https://img.shields.io/github/stars/TheShadowNinjaGMD/Timely.app?style=flat)](https://github.com/TheShadowNinjaGMD/Timely.app/stargazers)
[![Issues](https://img.shields.io/github/issues/TheShadowNinjaGMD/Timely.app)](https://github.com/TheShadowNinjaGMD/Timely.app/issues)

</div>

---

## Features

**Timer**
Type a length (`5`, `25`, `500`, `5:30`, `1:05:00`) or add time with the quick buttons. Up and Down arrows change the length by a minute.

**Stopwatch**
Centisecond precision with lap splits and running totals.

**Pomodoro study mode**
25 minutes of focus, 5 minutes of break, repeating. Breaks can start automatically and ambient music can follow the timer.

**Looks like it belongs on your Mac or iPhone**
Calm, minimal interface with translucent Liquid Glass surfaces, rounded outline icons and the system font (SF Pro on Apple devices). Light and dark follow your system, or pick one yourself.

**Draggable Liquid Glass switcher**
The Timer / Stopwatch switcher has a glass thumb you can tap or drag, like the tab bar in Apple's newer apps. It magnifies when pressed, stretches with your drag speed, and leaves a gooey accent-colored trail before snapping into place. Turn it off in **Settings → Appearance → Liquid Glass style** to get a plain solid pill.

**19 accent colors plus your own**
Ocean, Sunset, Forest, Lavender, Midnight, Rose, Candy, Gold, Slate, Cherry, Mint, Tangerine, Nebula, Autumn, Arctic, Neon, Coffee, Plum and Coral. The custom picker shows HEX, RGB, HSL, HSV and CMYK values.

**Sound that stays out of the way**
Subtle click sounds and a completion chime generated with Web Audio, with a master volume. Optional ambient music that only downloads when you turn it on, or play your own audio from an `https://` link.

**Installable and offline**
Add it to your home screen or dock. It works without a connection after the first visit.

### Keyboard shortcuts

| Key | Action |
| --- | --- |
| <kbd>Space</kbd> | Start or pause |
| <kbd>R</kbd> | Reset |
| <kbd>L</kbd> | Record a lap |
| <kbd>M</kbd> | Switch between Timer and Stopwatch |

While a timer or stopwatch runs, the remaining time is shown in the browser tab title.

---

## Accessibility

Timely is built to be usable without a mouse or a screen.

- Every control has an accessible name; the settings sheet is a native `<dialog>` with a focus trap and <kbd>Esc</kbd> to close.
- Mode tabs follow the WAI-ARIA tabs pattern with arrow-key navigation.
- Completion and lap announcements are read by screen readers through live regions.
- Accent colors are chosen to keep text and the progress ring readable in both light and dark appearance.
- Respects `prefers-color-scheme`, `prefers-reduced-motion`, `prefers-reduced-transparency` and forced-colors mode.
- Touch targets are at least 44 × 44 px; visible focus rings everywhere.
- Passes axe-core (WCAG 2.1 A and AA plus best practices) in light and dark.

## Performance

| | Before | After |
| --- | --- | --- |
| First-load transfer | about 2.6 MB | about 60 KB |
| Third-party requests | 2 (jsDelivr, Pixabay) | 0 |
| Render-blocking requests | 3 | 1 (stylesheet) |
| Lighthouse (local, desktop) | 98 / 78 / 96 / 100 | 100 / 100 / 100 / 100 |

How it got there: no libraries, system fonts, static HTML instead of JavaScript-rendered views, music and Liquid Glass loaded only on demand, timestamp-based timing, and a service worker for instant repeat visits. Scores on the live site depend on the network and on what GitHub Pages allows (it controls caching and security headers).

## Liquid Glass

The interface uses CSS Liquid Glass surfaces by default: translucent layers, `backdrop-filter` blur and saturation, and a specular edge. They fall back to solid surfaces when transparency is unavailable or reduced.

There is also an optional WebGL refraction effect on the control dock, powered by [ybouane/liquidglass](https://github.com/ybouane/liquidglass) (MIT, vendored in `vendor/`). It is off by default because it rasterizes the page and uses more battery. Enable it in **Settings → Experimental**.

## Privacy

Timely has no analytics and no accounts. Settings are stored in your browser's `localStorage` and never leave your device.

## Run locally

It is a static site. Any web server works:

```bash
git clone https://github.com/TheShadowNinjaGMD/Timely.app.git
cd Timely.app
python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` directly also works, except for the service worker and the optional Liquid Glass module, which need `http(s)://`.

## Project structure

```text
Timely.app/
├── index.html              Markup, SEO metadata, structured data
├── style.css               Design tokens, themes, Liquid Glass surfaces
├── script.js               Timer, stopwatch, settings, audio (no dependencies)
├── sw.js                   Service worker (offline + fast repeat visits)
├── manifest.webmanifest    Install metadata
├── 404.html                Not-found page
├── robots.txt, sitemap.xml Search engine files
├── favicon.svg / .ico      Icons (plus apple-touch-icon.png)
├── assets/                 App icons, social preview image, ambient.mp3
├── vendor/                 Optional Liquid Glass module (MIT)
├── changelog.md            Release notes
└── LICENSE
```

When you change any cached file, bump `CACHE` in `sw.js` so returning visitors get the update.

## Search and sharing

The page ships with a single descriptive `<title>`, meta description, canonical URL, Open Graph and Twitter cards, a JSON-LD `WebApplication` entry, a valid sitemap and robots file, and real text content for crawlers. To help it get found:

1. Add the site in [Google Search Console](https://search.google.com/search-console) and submit `sitemap.xml` (the two `google*.html` verification files in this repo are for that).
2. Do the same in [Bing Webmaster Tools](https://www.bing.com/webmasters).
3. Set the repository description and website URL on GitHub, and add topics such as `timer`, `stopwatch`, `pomodoro`, `pomodoro-timer`, `study-timer`, `productivity`, `pwa`, `vanilla-js`.
4. Link to the site from places you already have (your GitHub profile, project pages, social bios).

Rankings are never guaranteed, but this gives search engines everything they need to understand the page.

## Contributing

Issues and pull requests are welcome.

1. Fork the repository and create a branch: `git checkout -b feature/my-change`
2. Make your change and check it in a browser (no build step).
3. Commit with a clear message and open a pull request.

A GitHub Action lints the HTML and checks the JavaScript and manifest on every push and pull request.

## Credits and license

Made by [@TheShadowNinjaGMD](https://github.com/TheShadowNinjaGMD). Released under the terms in [LICENSE](LICENSE).

- Liquid Glass WebGL effect: [ybouane/liquidglass](https://github.com/ybouane/liquidglass), MIT.
- Icons are original outline glyphs drawn in the style of Apple's SF Symbols. Apple's actual SF Symbols are licensed for use in apps on Apple platforms and cannot be redistributed on the web.
- Interface follows Apple's [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) in spirit; Timely is not affiliated with Apple.
