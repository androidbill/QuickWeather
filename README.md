# QuickWeather

A swipe-first weather PWA. No build step, no dependencies — plain HTML, CSS and JavaScript
served straight from GitHub Pages: https://androidbill.github.io/QuickWeather/

## Features

- Live animated sky canvas: wind streaks that follow the real wind bearing and speed, rain,
  snow, drifting cloud, night stars and storm lightning
- Temperature-reactive palette — the hero number, panels and charts recolour from violet
  (cold) through cyan and amber to red (hot)
- Wind panel with a rotor that spins at the measured wind speed, a compass needle, Beaufort
  description, and a sustained-versus-gust meter
- 24-hour temperature curve plus per-hour cards with wind bearing and precipitation chance
- 14-day outlook with proportional high/low range bars
- Multiple saved cities: swipe left/right to switch, pull down to refresh
- Celsius/km/h or Fahrenheit/mph, light and dark themes, works offline on cached data

## Data

Forecasts and city search come from [Open-Meteo](https://open-meteo.com/); first-run reverse
geocoding uses [Nominatim](https://nominatim.openstreetmap.org/). No API keys are required.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Markup and app shell |
| `styles.css` | Theme tokens, layout, animations |
| `app.js` | State, Open-Meteo client, rendering, sky canvas |
| `sw.js` | Service worker (network first, cache as offline fallback) |
| `manifest.webmanifest` | PWA install metadata |
| `icons/` | App icons (SVG source plus 192/512 PNG) |

## Releasing

Bump the version in **two** places, then push:

1. `APP_VERSION` in `app.js` — shown in the footer and the About dialog
2. `CACHE_NAME` in `sw.js`

The service worker is network-first, so installed users pick up new files on next launch and
get a "New version ready" prompt to reload.
