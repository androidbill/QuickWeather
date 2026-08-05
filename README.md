# QuickWeather

A swipe-first weather PWA. No build step, no dependencies — plain HTML, CSS and JavaScript
served straight from GitHub Pages: https://androidbill.github.io/QuickWeather/

## Features

**Live**

- Animated sky canvas: wind streaks that follow the real wind bearing and speed, rain, snow,
  drifting cloud, night stars and storm lightning. Tap empty sky to send a gust through it.
- Temperature-reactive palette — the hero number, panels and charts recolour from violet
  (cold) through cyan and amber to red (hot)
- Wind panel with a rotor that spins at the measured wind speed, a compass needle, Beaufort
  description, and a sustained-versus-gust meter
- Sun arc showing the sun's real position between sunrise and sunset, with daylight remaining

**Interactive**

- **Drag the 24-hour curve** to preview any hour — the hero, wind panel, metrics and sky
  animation all rewind to that hour. Release to spring back to live conditions.
- Tap an hour card to pin that hour; tap a day in the 14-day strip to browse its hours
- Tap any Atmosphere tile to expand a 24-hour sparkline for that metric
- Severe weather chips (gusts, storms, high UV, heat, cold, big swings) — tap for detail
- Drag saved cities by the handle to reorder the swipe order
- Pull down to refresh with a progress ring, haptic feedback throughout

**Data on screen**

- 24-hour temperature curve plus per-hour cards with wind bearing and precipitation chance
- Precipitation timeline — "rain likely around 4PM" with 12 hours of probability bars
- Air quality (US AQI, PM2.5, PM10) on a colour-banded scale
- 14-day outlook with proportional high/low range bars
- Multiple saved cities, Celsius/km/h or Fahrenheit/mph, light and dark themes, works
  offline on cached data

## Data

Forecasts, air quality and city search come from [Open-Meteo](https://open-meteo.com/);
first-run reverse geocoding uses [Nominatim](https://nominatim.openstreetmap.org/). No API
keys are required. Air quality is fetched separately and fails soft — the forecast renders
regardless.

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
