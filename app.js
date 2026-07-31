const APP_VERSION = "2026.07.31.01";
const STORAGE_KEY = "quickweather_v1_1";
const STALE_AFTER_MS = 10 * 60 * 1000;

const FALLBACK_CITY = {
  id: "fallback-calgary",
  name: "Calgary",
  admin1: "Alberta",
  country: "Canada",
  latitude: 51.0447,
  longitude: -114.0719,
  timezone: "America/Edmonton"
};

const WEATHER_CODE_LABELS = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light showers",
  81: "Showers",
  82: "Heavy showers",
  85: "Light snow showers",
  86: "Snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm hail",
  99: "Heavy hail storm"
};

const BEAUFORT = [
  [1, "Calm"],
  [6, "Light air"],
  [12, "Light breeze"],
  [20, "Gentle breeze"],
  [29, "Moderate breeze"],
  [39, "Fresh breeze"],
  [50, "Strong breeze"],
  [62, "Near gale"],
  [75, "Gale"],
  [89, "Strong gale"],
  [103, "Storm"],
  [118, "Violent storm"]
];

// Colour ramp keyed to degrees Celsius; every other unit converts into this scale.
const TEMP_STOPS = [
  [-25, [124, 108, 255]],
  [-12, [74, 168, 255]],
  [0, [95, 229, 255]],
  [8, [99, 230, 168]],
  [16, [255, 216, 77]],
  [24, [255, 161, 77]],
  [31, [255, 127, 114]],
  [38, [255, 77, 109]]
];

const els = {
  body: document.body,
  themeColorMeta: document.getElementById("theme-color-meta"),
  skyCanvas: document.getElementById("sky-canvas"),
  screen: document.getElementById("screen"),
  cityName: document.getElementById("city-name"),
  cityDots: document.getElementById("city-dots"),
  defaultStar: document.getElementById("default-star"),
  themeToggleBtn: document.getElementById("theme-toggle-btn"),
  menuBtn: document.getElementById("menu-btn"),
  menuPanel: document.getElementById("menu-panel"),
  unitsMenuBtn: document.getElementById("units-menu-btn"),
  currentIcon: document.getElementById("current-icon"),
  currentTemp: document.getElementById("current-temp"),
  currentUnit: document.getElementById("current-unit"),
  currentCondition: document.getElementById("current-condition"),
  currentSummary: document.getElementById("current-summary"),
  tempTrackMarker: document.getElementById("temp-track-marker"),
  todayLow: document.getElementById("today-low"),
  todayHigh: document.getElementById("today-high"),
  feelsLike: document.getElementById("feels-like"),
  windSpeed: document.getElementById("wind-speed"),
  windSpeedUnit: document.querySelector(".wind-speed-unit"),
  windBeaufort: document.getElementById("wind-beaufort"),
  windDirection: document.getElementById("wind-direction"),
  windGust: document.getElementById("wind-gust"),
  windCompassNeedle: document.getElementById("wind-compass-needle"),
  gustFill: document.getElementById("gust-fill"),
  gustPeak: document.getElementById("gust-peak"),
  humidity: document.getElementById("humidity"),
  uvIndex: document.getElementById("uv-index"),
  sunrise: document.getElementById("sunrise"),
  sunset: document.getElementById("sunset"),
  tempRibbon: document.getElementById("temp-ribbon"),
  hourlyForecast: document.getElementById("hourly-forecast"),
  dailyForecast: document.getElementById("daily-forecast"),
  versionLabel: document.getElementById("version-label"),
  updatedLabel: document.getElementById("updated-label"),
  aboutVersion: document.getElementById("about-version"),
  statusBanner: document.getElementById("status-banner"),
  refreshHint: document.getElementById("refresh-hint"),
  updateToast: document.getElementById("update-toast"),
  updateReloadBtn: document.getElementById("update-reload-btn"),
  citySwipeZone: document.getElementById("city-swipe-zone"),
  modalBackdrop: document.getElementById("modal-backdrop"),
  searchModal: document.getElementById("search-modal"),
  removeModal: document.getElementById("remove-modal"),
  aboutModal: document.getElementById("about-modal"),
  searchForm: document.getElementById("search-form"),
  citySearchInput: document.getElementById("city-search-input"),
  searchResults: document.getElementById("search-results"),
  removeCityList: document.getElementById("remove-city-list")
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let state = loadState();
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let pullArmed = false;
let displayedTemp = null;
let tempAnimation = 0;
const pendingWeatherRefresh = new Set();
const weatherErrors = new Map();

function defaultState() {
  return {
    theme: "dark",
    units: "celsius",
    cities: [],
    defaultCityId: null,
    activeCityId: null
  };
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return {
      ...defaultState(),
      ...parsed,
      cities: Array.isArray(parsed?.cities) ? parsed.cities : []
    };
  } catch {
    return defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be full or blocked; the session still works in memory.
  }
}

function setState(mutator) {
  mutator(state);
  saveState();
  renderShell();
}

function getActiveCity() {
  if (!state.cities.length) return null;
  return state.cities.find((city) => city.id === state.activeCityId) || state.cities[0];
}

function makeCityId(city) {
  return `${city.name}-${city.latitude}-${city.longitude}`.toLowerCase().replace(/\s+/g, "-");
}

function normalizeCity(city) {
  return {
    id: city.id || makeCityId(city),
    name: city.name,
    admin1: city.admin1 || "",
    country: city.country || "",
    latitude: Number(city.latitude),
    longitude: Number(city.longitude),
    timezone: city.timezone || "auto",
    weather: city.weather || null,
    fetchedAt: city.fetchedAt || 0
  };
}

function hasValidCoordinates(city) {
  return Number.isFinite(Number(city?.latitude)) && Number.isFinite(Number(city?.longitude));
}

function themeIcon(theme) {
  return theme === "dark" ? "☀" : "☾";
}

function unitLabel() {
  return state.units === "celsius" ? "Switch to Fahrenheit" : "Switch to Celsius";
}

function unitSuffix() {
  return state.units === "celsius" ? "°C" : "°F";
}

function windUnit() {
  return state.units === "celsius" ? "km/h" : "mph";
}

function windApiUnit() {
  return state.units === "celsius" ? "kmh" : "mph";
}

function toCelsius(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return state.units === "celsius" ? num : (num - 32) * (5 / 9);
}

function toKmh(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return state.units === "celsius" ? num : num * 1.609344;
}

function setStatus(message, delay = 2200) {
  els.statusBanner.textContent = message;
  els.statusBanner.classList.remove("hidden");
  window.clearTimeout(setStatus.timer);
  setStatus.timer = window.setTimeout(() => els.statusBanner.classList.add("hidden"), delay);
}

function weatherLabel(code) {
  return WEATHER_CODE_LABELS[code] || "Weather";
}

function isMissing(value) {
  return value == null || value === "" || !Number.isFinite(Number(value));
}

function formatTemperature(value) {
  if (isMissing(value)) return "--";
  return `${Math.round(Number(value))}°`;
}

function formatWind(value) {
  if (isMissing(value)) return "--";
  return `${Math.round(Number(value))} ${windUnit()}`;
}

function formatGust(value) {
  if (isMissing(value)) return "Gust --";
  return `Gust ${Math.round(Number(value))} ${windUnit()}`;
}

function beaufortLabel(speed) {
  const kmh = toKmh(speed);
  if (kmh == null) return "--";
  for (const [ceiling, label] of BEAUFORT) {
    if (kmh < ceiling) return label;
  }
  return "Hurricane force";
}

function formatClock(iso) {
  const timePart = String(iso).split("T")[1] || "";
  const [hourText = "", minute = "00"] = timePart.split(":");
  const hour = Number(hourText);
  if (!hourText || !Number.isFinite(hour)) return "--";
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${suffix}`;
}

function formatDay(iso) {
  const [year, month, day] = String(iso).split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return "--";
  const stableDate = new Date(Date.UTC(year, month - 1, day, 12));
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(stableDate);
}

function formatHourLabel(iso) {
  const timePart = String(iso).split("T")[1] || "";
  const [hourText = ""] = timePart.split(":");
  const hour = Number(hourText);
  if (!hourText || !Number.isFinite(hour)) return "--";
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}${suffix}`;
}

function currentHourIso(weather) {
  const utcOffsetSeconds = Number(weather?.utc_offset_seconds);
  const date = Number.isFinite(utcOffsetSeconds)
    ? new Date(Date.now() + utcOffsetSeconds * 1000)
    : new Date();
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:00`;
}

function getCurrentHourIndex(hourlyTime, current, weather) {
  const localCurrentHour = currentHourIso(weather);
  const localIndex = hourlyTime.findIndex((time) => time === localCurrentHour);
  if (localIndex >= 0) return localIndex;

  if (localCurrentHour) {
    for (let index = hourlyTime.length - 1; index >= 0; index -= 1) {
      if (hourlyTime[index] <= localCurrentHour) return index;
    }
  }

  const apiCurrentIndex = hourlyTime.findIndex((time) => time === current.time);
  return apiCurrentIndex >= 0 ? apiCurrentIndex : 0;
}

function compassDirection(degrees) {
  if (isMissing(degrees)) return "--";
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(Number(degrees) / 45) % 8];
}

function windArrow(degrees) {
  if (isMissing(degrees)) return "↑";
  return `<span class="wind-arrow" style="--arrow-rotation: ${Number(degrees)}deg">↑</span>`;
}

function pickArray(source, keys) {
  for (const key of keys) {
    const value = source?.[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function hasRenderableForecast(weather) {
  return pickArray(weather?.hourly, ["time"]).length > 0 && pickArray(weather?.daily, ["time"]).length > 0;
}

function skyMode(code, isDay) {
  if (!isDay) return "night";
  if ([95, 96, 99].includes(code)) return "storm";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([1, 2, 3, 45, 48].includes(code)) return "cloud";
  return "clear";
}

// Precipitation keeps falling after dark, so the canvas needs the weather on its own.
function precipMode(code) {
  if ([95, 96, 99].includes(code)) return "storm";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  return "";
}

function themeChromeColor(theme, sky) {
  if (theme === "light") return "#eef5ff";
  const map = {
    clear: "#1b4270",
    cloud: "#233552",
    rain: "#16263b",
    snow: "#243d61",
    storm: "#171f38",
    night: "#101b34"
  };
  return map[sky] || "#142033";
}

function tempRgb(celsius) {
  if (celsius == null || !Number.isFinite(celsius)) return TEMP_STOPS[2][1];
  if (celsius <= TEMP_STOPS[0][0]) return TEMP_STOPS[0][1];
  const last = TEMP_STOPS[TEMP_STOPS.length - 1];
  if (celsius >= last[0]) return last[1];

  for (let index = 0; index < TEMP_STOPS.length - 1; index += 1) {
    const [lowTemp, lowColor] = TEMP_STOPS[index];
    const [highTemp, highColor] = TEMP_STOPS[index + 1];
    if (celsius >= lowTemp && celsius <= highTemp) {
      const ratio = (celsius - lowTemp) / (highTemp - lowTemp);
      return lowColor.map((channel, i) => Math.round(channel + (highColor[i] - channel) * ratio));
    }
  }
  return TEMP_STOPS[2][1];
}

function tempColor(value) {
  const [r, g, b] = tempRgb(toCelsius(value));
  return `rgb(${r}, ${g}, ${b})`;
}

function tempColorAlpha(value, alpha) {
  const [r, g, b] = tempRgb(toCelsius(value));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyTempTheme(value) {
  const celsius = toCelsius(value);
  const base = tempRgb(celsius);
  const shifted = tempRgb(celsius == null ? null : celsius + 7);
  els.body.style.setProperty("--temp-a", `rgb(${base[0]}, ${base[1]}, ${base[2]})`);
  els.body.style.setProperty("--temp-b", `rgb(${shifted[0]}, ${shifted[1]}, ${shifted[2]})`);
  els.body.style.setProperty("--temp-glow", `rgba(${base[0]}, ${base[1]}, ${base[2]}, 0.34)`);
  return base;
}

/* ------------------------------------------------------------- sky canvas */

const sky = {
  ctx: null,
  width: 0,
  height: 0,
  raf: 0,
  lastFrame: 0,
  elapsed: 0,
  mode: "cloud",
  windSpeedKmh: 10,
  windDirection: 270,
  accent: [95, 229, 255],
  streaks: [],
  drops: [],
  clouds: [],
  stars: [],
  flash: 0,
  nextFlash: 6
};

function random(min, max) {
  return min + Math.random() * (max - min);
}

function windVector() {
  // Meteorological direction is where wind comes FROM, so travel is that plus 180 degrees.
  const radians = ((sky.windDirection + 180) * Math.PI) / 180;
  return { x: Math.sin(radians), y: -Math.cos(radians) };
}

function windPixelsPerSecond() {
  return 26 + Math.min(sky.windSpeedKmh, 90) * 3.4;
}

function seedStreaks() {
  const target = Math.round(Math.min(70, 16 + sky.windSpeedKmh * 1.15));
  sky.streaks = Array.from({ length: target }, () => ({
    x: random(-0.1, 1.1) * sky.width,
    y: random(0, 1) * sky.height,
    length: random(28, 120),
    alpha: random(0.06, 0.24),
    speed: random(0.65, 1.5)
  }));
}

function seedDrops() {
  if (sky.mode === "rain" || sky.mode === "storm") {
    const target = sky.mode === "storm" ? 190 : 130;
    sky.drops = Array.from({ length: target }, () => ({
      x: random(0, sky.width),
      y: random(0, sky.height),
      length: random(9, 20),
      speed: random(520, 820),
      alpha: random(0.18, 0.42)
    }));
    return;
  }

  if (sky.mode === "snow") {
    sky.drops = Array.from({ length: 110 }, () => ({
      x: random(0, sky.width),
      y: random(0, sky.height),
      radius: random(1.1, 3.2),
      speed: random(24, 62),
      sway: random(8, 26),
      phase: random(0, Math.PI * 2),
      alpha: random(0.3, 0.75)
    }));
    return;
  }

  sky.drops = [];
}

function seedClouds() {
  const count = sky.mode === "clear" ? 2 : 5;
  sky.clouds = Array.from({ length: count }, () => ({
    x: random(0, sky.width),
    y: random(0.04, 0.55) * sky.height,
    radius: random(70, 170),
    alpha: random(0.05, 0.13),
    drift: random(0.16, 0.4)
  }));
}

function seedStars() {
  sky.stars = sky.mode === "night"
    ? Array.from({ length: 70 }, () => ({
        x: random(0, sky.width),
        y: random(0, sky.height * 0.75),
        radius: random(0.5, 1.6),
        phase: random(0, Math.PI * 2)
      }))
    : [];
}

function resizeSky() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  sky.width = window.innerWidth;
  sky.height = window.innerHeight;
  els.skyCanvas.width = Math.round(sky.width * dpr);
  els.skyCanvas.height = Math.round(sky.height * dpr);
  sky.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  seedStreaks();
  seedDrops();
  seedClouds();
  seedStars();
}

function drawStars(ctx) {
  if (!sky.stars.length) return;
  ctx.fillStyle = "#ffffff";
  for (const star of sky.stars) {
    const twinkle = 0.45 + 0.55 * Math.abs(Math.sin(sky.elapsed * 0.9 + star.phase));
    ctx.globalAlpha = twinkle * 0.8;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawCelestialGlow(ctx) {
  const isNight = sky.mode === "night";
  const x = isNight ? sky.width * 0.2 : sky.width * 0.82;
  const y = sky.height * 0.13;
  const pulse = 1 + Math.sin(sky.elapsed * 0.6) * 0.06;
  const radius = (isNight ? 130 : 210) * pulse;
  const [r, g, b] = sky.accent;

  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, isNight ? "rgba(226, 236, 255, 0.22)" : `rgba(${r}, ${g}, ${b}, 0.3)`);
  gradient.addColorStop(0.45, isNight ? "rgba(226, 236, 255, 0.06)" : `rgba(${r}, ${g}, ${b}, 0.09)`);
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawClouds(ctx, delta) {
  const vector = windVector();
  const speed = windPixelsPerSecond();

  for (const cloud of sky.clouds) {
    cloud.x += vector.x * speed * cloud.drift * delta;
    cloud.y += vector.y * speed * cloud.drift * 0.25 * delta;

    if (cloud.x - cloud.radius > sky.width) cloud.x = -cloud.radius;
    if (cloud.x + cloud.radius < 0) cloud.x = sky.width + cloud.radius;
    if (cloud.y - cloud.radius > sky.height) cloud.y = -cloud.radius;
    if (cloud.y + cloud.radius < 0) cloud.y = sky.height + cloud.radius;

    const gradient = ctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.radius);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${cloud.alpha})`);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStreaks(ctx, delta) {
  const vector = windVector();
  const speed = windPixelsPerSecond();
  const [r, g, b] = sky.accent;
  const margin = 140;

  ctx.lineCap = "round";
  ctx.lineWidth = 1.4;

  for (const streak of sky.streaks) {
    streak.x += vector.x * speed * streak.speed * delta;
    streak.y += vector.y * speed * streak.speed * delta;

    if (streak.x < -margin) streak.x = sky.width + margin;
    if (streak.x > sky.width + margin) streak.x = -margin;
    if (streak.y < -margin) streak.y = sky.height + margin;
    if (streak.y > sky.height + margin) streak.y = -margin;

    const tailX = streak.x - vector.x * streak.length;
    const tailY = streak.y - vector.y * streak.length;
    const gradient = ctx.createLinearGradient(tailX, tailY, streak.x, streak.y);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${streak.alpha})`);

    ctx.strokeStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(streak.x, streak.y);
    ctx.stroke();
  }
}

function drawPrecipitation(ctx, delta) {
  if (!sky.drops.length) return;
  const vector = windVector();
  const push = vector.x * Math.min(sky.windSpeedKmh, 80) * 3.2;

  if (sky.mode === "snow") {
    ctx.fillStyle = "#ffffff";
    for (const flake of sky.drops) {
      flake.y += flake.speed * delta;
      flake.x += (push * 0.25 + Math.sin(sky.elapsed * 0.8 + flake.phase) * flake.sway) * delta;

      if (flake.y > sky.height + 6) {
        flake.y = -6;
        flake.x = random(0, sky.width);
      }
      if (flake.x < -10) flake.x = sky.width + 10;
      if (flake.x > sky.width + 10) flake.x = -10;

      ctx.globalAlpha = flake.alpha;
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    return;
  }

  ctx.lineWidth = 1.2;
  ctx.lineCap = "round";
  for (const drop of sky.drops) {
    drop.y += drop.speed * delta;
    drop.x += push * 0.55 * delta;

    if (drop.y > sky.height + drop.length) {
      drop.y = -drop.length;
      drop.x = random(-40, sky.width + 40);
    }
    if (drop.x < -40) drop.x = sky.width + 40;
    if (drop.x > sky.width + 40) drop.x = -40;

    const slant = ((push * 0.55) / drop.speed) * drop.length;
    ctx.strokeStyle = `rgba(190, 224, 255, ${drop.alpha})`;
    ctx.beginPath();
    ctx.moveTo(drop.x - slant, drop.y - drop.length);
    ctx.lineTo(drop.x, drop.y);
    ctx.stroke();
  }
}

function drawLightning(ctx, delta) {
  if (sky.mode !== "storm") return;

  if (sky.elapsed > sky.nextFlash) {
    sky.flash = 1;
    sky.nextFlash = sky.elapsed + random(4, 11);
  }
  if (sky.flash <= 0) return;

  sky.flash = Math.max(0, sky.flash - delta * 3.4);
  ctx.fillStyle = `rgba(226, 236, 255, ${sky.flash * 0.2})`;
  ctx.fillRect(0, 0, sky.width, sky.height);
}

function paintSky(delta) {
  const ctx = sky.ctx;
  ctx.clearRect(0, 0, sky.width, sky.height);
  drawCelestialGlow(ctx);
  drawStars(ctx);
  drawClouds(ctx, delta);
  drawStreaks(ctx, delta);
  drawPrecipitation(ctx, delta);
  drawLightning(ctx, delta);
}

function skyFrame(timestamp) {
  const delta = sky.lastFrame ? Math.min((timestamp - sky.lastFrame) / 1000, 0.05) : 0.016;
  sky.lastFrame = timestamp;
  sky.elapsed += delta;
  paintSky(delta);
  sky.raf = window.requestAnimationFrame(skyFrame);
}

function startSky() {
  if (sky.raf || prefersReducedMotion || !sky.ctx) return;
  sky.lastFrame = 0;
  sky.raf = window.requestAnimationFrame(skyFrame);
}

function stopSky() {
  if (!sky.raf) return;
  window.cancelAnimationFrame(sky.raf);
  sky.raf = 0;
}

function initSky() {
  if (!els.skyCanvas?.getContext) return;
  sky.ctx = els.skyCanvas.getContext("2d");
  if (!sky.ctx) return;

  resizeSky();
  window.addEventListener("resize", () => {
    resizeSky();
    if (prefersReducedMotion) paintSky(0);
  });

  if (prefersReducedMotion) {
    paintSky(0);
    return;
  }
  startSky();
}

function updateSky({ mode, windSpeed, windDirection, accent }) {
  if (!sky.ctx) return;
  const nextMode = mode || "cloud";
  const modeChanged = nextMode !== sky.mode;

  sky.mode = nextMode;
  sky.windSpeedKmh = Math.max(0, toKmh(windSpeed) ?? 8);
  sky.windDirection = Number.isFinite(Number(windDirection)) ? Number(windDirection) : sky.windDirection;
  sky.accent = accent || sky.accent;

  if (modeChanged) {
    seedDrops();
    seedClouds();
    seedStars();
  }
  seedStreaks();
  if (prefersReducedMotion) paintSky(0);
}

/* -------------------------------------------------------- number animation */

function animateTemperature(target) {
  const next = Number(target);
  window.cancelAnimationFrame(tempAnimation);

  if (!Number.isFinite(next)) {
    displayedTemp = null;
    els.currentTemp.textContent = "--";
    return;
  }

  if (prefersReducedMotion || displayedTemp == null || Math.round(displayedTemp) === Math.round(next)) {
    displayedTemp = next;
    els.currentTemp.textContent = String(Math.round(next));
    return;
  }

  const from = displayedTemp;
  const duration = 900;
  const start = performance.now();

  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    els.currentTemp.textContent = String(Math.round(from + (next - from) * eased));
    if (progress < 1) {
      tempAnimation = window.requestAnimationFrame(step);
    } else {
      displayedTemp = next;
    }
  };

  tempAnimation = window.requestAnimationFrame(step);
}

/* ----------------------------------------------------------- ribbon chart */

function smoothPath(points) {
  if (points.length < 2) return "";
  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const point = points[index];
    const midX = (previous.x + point.x) / 2;
    const midY = (previous.y + point.y) / 2;
    path += ` Q ${previous.x.toFixed(1)} ${previous.y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`;
  }
  const last = points[points.length - 1];
  path += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return path;
}

function renderTempRibbon(hours) {
  const temps = hours.map((hour) => Number(hour.temperature)).filter(Number.isFinite);
  if (hours.length < 2 || temps.length < 2) {
    els.tempRibbon.innerHTML = "";
    return;
  }

  // Draw in real pixel units so the labels are not stretched by viewBox scaling.
  const width = Math.max(els.tempRibbon.clientWidth || 340, 200);
  const height = Math.max(els.tempRibbon.clientHeight || 86, 60);
  const top = 18;
  const bottom = height - 26;
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const span = Math.max(max - min, 1);

  const points = hours.map((hour, index) => {
    const value = Number.isFinite(Number(hour.temperature)) ? Number(hour.temperature) : min;
    return {
      x: (index / (hours.length - 1)) * width,
      y: bottom - ((value - min) / span) * (bottom - top),
      value,
      time: hour.time
    };
  });

  const line = smoothPath(points);
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;

  const strokeStops = points
    .filter((_, index) => index % 4 === 0 || index === points.length - 1)
    .map((point) => `<stop offset="${((point.x / width) * 100).toFixed(1)}%" stop-color="${tempColor(point.value)}" />`)
    .join("");

  const fillStops = `
    <stop offset="0%" stop-color="${tempColorAlpha(max, 0.42)}" />
    <stop offset="100%" stop-color="${tempColorAlpha(min, 0)}" />
  `;

  const maxPoint = points.reduce((best, point) => (point.value > best.value ? point : best), points[0]);
  const minPoint = points.reduce((best, point) => (point.value < best.value ? point : best), points[0]);
  const nowPoint = points[0];

  const ticks = points
    .map((point, index) => ({ point, index }))
    .filter(({ index }) => index > 0 && index % 6 === 0)
    .map(({ point }) => `
      <line class="ribbon-grid" x1="${point.x.toFixed(1)}" y1="${top - 6}" x2="${point.x.toFixed(1)}" y2="${bottom + 6}" />
      <text class="ribbon-label" x="${point.x.toFixed(1)}" y="${height - 4}" text-anchor="middle">${formatHourLabel(point.time)}</text>
    `)
    .join("");

  const clampX = (value) => Math.min(Math.max(value, 20), width - 20).toFixed(1);

  els.tempRibbon.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Temperature over the next 24 hours">
      <defs>
        <linearGradient id="ribbonStroke" x1="0" y1="0" x2="1" y2="0">${strokeStops}</linearGradient>
        <linearGradient id="ribbonFill" x1="0" y1="0" x2="0" y2="1">${fillStops}</linearGradient>
      </defs>
      ${ticks}
      <path class="ribbon-area" d="${area}" />
      <path class="ribbon-line" d="${line}" />
      <circle class="ribbon-now" cx="${nowPoint.x.toFixed(1)}" cy="${nowPoint.y.toFixed(1)}" r="3.5" />
      <text class="ribbon-label" x="${clampX(maxPoint.x)}" y="${(maxPoint.y - 8).toFixed(1)}" text-anchor="middle">${formatTemperature(maxPoint.value)}</text>
      <text class="ribbon-label" x="${clampX(minPoint.x)}" y="${(minPoint.y + 14).toFixed(1)}" text-anchor="middle">${formatTemperature(minPoint.value)}</text>
    </svg>
  `;

  const path = els.tempRibbon.querySelector(".ribbon-line");
  if (path && typeof path.getTotalLength === "function") {
    path.style.setProperty("--ribbon-length", String(Math.ceil(path.getTotalLength())));
  }
}

/* ------------------------------------------------------------- rendering */

function openModal(modal) {
  els.modalBackdrop.classList.remove("hidden");
  modal.classList.remove("hidden");
  closeMenu();
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.add("hidden");
  const anyOpen = [els.searchModal, els.removeModal, els.aboutModal].some((node) => !node.classList.contains("hidden"));
  if (!anyOpen) els.modalBackdrop.classList.add("hidden");
}

function closeAllModals() {
  [els.searchModal, els.removeModal, els.aboutModal].forEach((modal) => modal.classList.add("hidden"));
  els.modalBackdrop.classList.add("hidden");
}

function toggleMenu() {
  els.menuPanel.classList.toggle("hidden");
}

function closeMenu() {
  els.menuPanel.classList.add("hidden");
}

function renderCityDots() {
  if (state.cities.length < 2) {
    els.cityDots.innerHTML = "";
    return;
  }
  const activeId = getActiveCity()?.id;
  els.cityDots.innerHTML = state.cities
    .map((city) => `<span class="${city.id === activeId ? "is-active" : ""}"></span>`)
    .join("");
}

function renderFooter(city) {
  els.versionLabel.textContent = `QuickWeather v${APP_VERSION}`;
  if (!city?.fetchedAt) {
    els.updatedLabel.textContent = "";
    return;
  }
  const stamp = new Date(city.fetchedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  els.updatedLabel.textContent = `Updated ${stamp}`;
}

function renderPlaceholder(condition, summary) {
  els.body.dataset.sky = "cloud";
  els.themeColorMeta.setAttribute("content", themeChromeColor(state.theme, "cloud"));
  applyTempTheme(null);
  els.currentIcon.innerHTML = weatherIconSvg(2, true);
  displayedTemp = null;
  els.currentTemp.textContent = "--";
  els.currentUnit.textContent = unitSuffix();
  els.currentCondition.textContent = condition;
  els.currentSummary.textContent = summary;
  els.todayLow.textContent = "--";
  els.todayHigh.textContent = "--";
  els.tempTrackMarker.style.left = "50%";
  els.feelsLike.textContent = "--";
  els.windSpeed.textContent = "--";
  els.windSpeedUnit.textContent = windUnit();
  els.windBeaufort.textContent = "--";
  els.windDirection.textContent = "--";
  els.windGust.textContent = "Gust --";
  els.windCompassNeedle.style.setProperty("--wind-rotation", "0deg");
  els.body.style.setProperty("--rotor-duration", "9s");
  els.gustFill.style.width = "0%";
  els.gustPeak.classList.remove("is-visible");
  els.humidity.textContent = "--";
  els.uvIndex.textContent = "--";
  els.sunrise.textContent = "--";
  els.sunset.textContent = "--";
  els.tempRibbon.innerHTML = "";
  els.hourlyForecast.innerHTML = "";
  els.dailyForecast.innerHTML = "";
}

function queueRefresh() {
  if (renderShell.refreshQueued) return;
  renderShell.refreshQueued = true;
  queueMicrotask(async () => {
    try {
      await refreshActiveWeather();
    } finally {
      renderShell.refreshQueued = false;
    }
  });
}

function buildHeroSummary(current, daily) {
  const bits = [];
  if (!isMissing(current.wind_speed_10m)) {
    bits.push(`${compassDirection(current.wind_direction_10m)} wind at ${formatWind(current.wind_speed_10m)}`);
  }
  if (!isMissing(current.wind_gusts_10m)) bits.push(`gusts ${formatWind(current.wind_gusts_10m)}`);
  if (!isMissing(current.relative_humidity_2m)) bits.push(`${Math.round(Number(current.relative_humidity_2m))}% humidity`);
  const precip = pickArray(daily, ["precipitation_probability_max"])[0];
  if (!isMissing(precip)) bits.push(`${Math.round(Number(precip))}% chance of precipitation`);
  return bits.join(" • ");
}

function renderShell() {
  els.body.dataset.theme = state.theme;
  els.themeToggleBtn.textContent = themeIcon(state.theme);
  els.unitsMenuBtn.textContent = unitLabel();
  els.aboutVersion.textContent = APP_VERSION;

  const activeCity = getActiveCity();
  const activeError = activeCity ? weatherErrors.get(activeCity.id) : "";
  els.cityName.textContent = activeCity ? activeCity.name : "Loading...";
  els.defaultStar.classList.toggle("is-default", Boolean(activeCity && activeCity.id === state.defaultCityId));
  renderCityDots();
  renderFooter(activeCity);

  if (!activeCity?.weather) {
    renderPlaceholder(
      activeCity ? activeError || "Loading weather..." : "Finding your city...",
      "Preparing wind profile..."
    );
    if (activeCity && !activeError && !pendingWeatherRefresh.has(activeCity.id)) queueRefresh();
    return;
  }

  if (!hasRenderableForecast(activeCity.weather)) {
    renderPlaceholder("Updating forecast...", "Refreshing wind profile...");
    if (!pendingWeatherRefresh.has(activeCity.id)) queueRefresh();
    return;
  }

  const weather = activeCity.weather;
  const current = weather.current;
  const todayIndex = 0;
  const dailyTime = pickArray(weather.daily, ["time"]);
  const dailyCodes = pickArray(weather.daily, ["weather_code", "weathercode"]);
  const dailyHighs = pickArray(weather.daily, ["temperature_2m_max"]);
  const dailyLows = pickArray(weather.daily, ["temperature_2m_min"]);
  const dailySunrise = pickArray(weather.daily, ["sunrise"]);
  const dailySunset = pickArray(weather.daily, ["sunset"]);
  const dailyPrecipMax = pickArray(weather.daily, ["precipitation_probability_max"]);
  const hourlyTime = pickArray(weather.hourly, ["time"]);
  const hourlyTemps = pickArray(weather.hourly, ["temperature_2m"]);
  const hourlyWinds = pickArray(weather.hourly, ["wind_speed_10m", "windspeed_10m"]);
  const hourlyWindDirections = pickArray(weather.hourly, ["wind_direction_10m", "winddirection_10m"]);
  const hourlyCodes = pickArray(weather.hourly, ["weather_code", "weathercode"]);
  const hourlyPrecip = pickArray(weather.hourly, ["precipitation_probability"]);
  const currentSky = skyMode(current.weather_code, Boolean(current.is_day));

  const accent = applyTempTheme(current.temperature_2m);
  els.body.dataset.sky = currentSky;
  els.themeColorMeta.setAttribute("content", themeChromeColor(state.theme, currentSky));

  els.currentIcon.innerHTML = weatherIconSvg(current.weather_code, Boolean(current.is_day));
  animateTemperature(current.temperature_2m);
  els.currentUnit.textContent = unitSuffix();
  els.currentCondition.textContent = weatherLabel(current.weather_code);
  els.currentSummary.textContent = buildHeroSummary(current, weather.daily);
  els.feelsLike.textContent = formatTemperature(current.apparent_temperature);

  const todayLow = Number(dailyLows[todayIndex]);
  const todayHigh = Number(dailyHighs[todayIndex]);
  const currentTemp = Number(current.temperature_2m);
  els.todayLow.textContent = formatTemperature(todayLow);
  els.todayHigh.textContent = formatTemperature(todayHigh);
  if (Number.isFinite(todayLow) && Number.isFinite(todayHigh) && todayHigh > todayLow && Number.isFinite(currentTemp)) {
    const ratio = (currentTemp - todayLow) / (todayHigh - todayLow);
    els.tempTrackMarker.style.left = `${Math.min(Math.max(ratio, 0), 1) * 100}%`;
  } else {
    els.tempTrackMarker.style.left = "50%";
  }

  els.windSpeed.textContent = isMissing(current.wind_speed_10m) ? "--" : String(Math.round(Number(current.wind_speed_10m)));
  els.windSpeedUnit.textContent = windUnit();
  els.windBeaufort.textContent = beaufortLabel(current.wind_speed_10m);
  els.windDirection.textContent = isMissing(current.wind_direction_10m)
    ? "--"
    : `${compassDirection(current.wind_direction_10m)} ${Math.round(Number(current.wind_direction_10m))}°`;
  els.windGust.textContent = formatGust(current.wind_gusts_10m);
  els.windCompassNeedle.style.setProperty("--wind-rotation", `${Number(current.wind_direction_10m) || 0}deg`);

  const windKmh = toKmh(current.wind_speed_10m) ?? 0;
  const rotorSeconds = Math.max(0.35, 14 - Math.min(windKmh, 80) * 0.16);
  els.body.style.setProperty("--rotor-duration", `${rotorSeconds.toFixed(2)}s`);

  const gustKmh = toKmh(current.wind_gusts_10m);
  els.gustFill.style.width = `${Math.min(windKmh / 80, 1) * 100}%`;
  if (gustKmh != null && gustKmh > windKmh) {
    els.gustPeak.classList.add("is-visible");
    els.gustPeak.style.left = `${Math.min(gustKmh / 80, 1) * 100}%`;
  } else {
    els.gustPeak.classList.remove("is-visible");
  }

  els.humidity.textContent = isMissing(current.relative_humidity_2m)
    ? "--"
    : `${Math.round(Number(current.relative_humidity_2m))}%`;
  els.uvIndex.textContent = isMissing(current.uv_index)
    ? "--"
    : String(Math.round(Number(current.uv_index) * 10) / 10);
  els.sunrise.textContent = formatClock(dailySunrise[todayIndex]);
  els.sunset.textContent = formatClock(dailySunset[todayIndex]);

  updateSky({
    mode: precipMode(current.weather_code) || currentSky,
    windSpeed: current.wind_speed_10m,
    windDirection: current.wind_direction_10m,
    accent
  });

  const startIndex = getCurrentHourIndex(hourlyTime, current, weather);
  const hourlySlice = hourlyTime.slice(startIndex, startIndex + 24).map((time, index) => ({
    time,
    temperature: hourlyTemps[startIndex + index],
    wind: hourlyWinds[startIndex + index],
    windDirection: hourlyWindDirections[startIndex + index],
    code: hourlyCodes[startIndex + index],
    precipitationProbability: hourlyPrecip[startIndex + index]
  }));

  renderTempRibbon(hourlySlice);

  els.hourlyForecast.innerHTML = hourlySlice.map((hour, index) => `
    <article class="forecast-card${index === 0 ? " is-now" : ""}" style="--card-temp: ${tempColor(hour.temperature)}">
      <div class="forecast-label">${index === 0 ? "Now" : formatHourLabel(hour.time)}</div>
      <div class="forecast-icon">${weatherIconSvg(hour.code, true)}</div>
      <div class="forecast-temp">${formatTemperature(hour.temperature)}</div>
      <div class="forecast-sub">${windArrow(hour.windDirection)} ${formatWind(hour.wind)}</div>
      <div class="forecast-direction">${compassDirection(hour.windDirection)}</div>
      <div class="forecast-note">${!isMissing(hour.precipitationProbability) && Number(hour.precipitationProbability) > 0 ? `${Math.round(Number(hour.precipitationProbability))}% precip` : ""}</div>
    </article>
  `).join("");

  const visibleDays = dailyTime.slice(0, 14);
  const dayTemps = [...dailyHighs.slice(0, 14), ...dailyLows.slice(0, 14)].map(Number).filter(Number.isFinite);
  const rangeMax = dayTemps.length ? Math.max(...dayTemps) : 1;
  const rangeMin = dayTemps.length ? Math.min(...dayTemps) : 0;
  const rangeSpan = Math.max(rangeMax - rangeMin, 1);

  els.dailyForecast.innerHTML = visibleDays.map((date, index) => {
    const high = Number(dailyHighs[index]);
    const low = Number(dailyLows[index]);
    const hasRange = Number.isFinite(high) && Number.isFinite(low);
    const barTop = hasRange ? ((rangeMax - high) / rangeSpan) * 100 : 0;
    const barHeight = hasRange ? Math.max(((high - low) / rangeSpan) * 100, 6) : 100;

    return `
      <article class="forecast-card daily-card" style="--card-high: ${tempColor(high)}; --card-low: ${tempColor(low)}">
        <div class="forecast-label">${index === 0 ? "Today" : formatDay(date)}</div>
        <div class="forecast-icon">${weatherIconSvg(dailyCodes[index], true)}</div>
        <div class="range-bar"><div class="range-bar-fill" style="--bar-top: ${barTop.toFixed(1)}%; --bar-height: ${barHeight.toFixed(1)}%"></div></div>
        <div class="forecast-range"><span class="range-high">${formatTemperature(high)}</span> <span class="range-low">${formatTemperature(low)}</span></div>
        <div class="forecast-note">${!isMissing(dailyPrecipMax[index]) && Number(dailyPrecipMax[index]) > 0 ? `${Math.round(Number(dailyPrecipMax[index]))}%` : ""}</div>
      </article>
    `;
  }).join("");
}

function renderSearchResults(results = [], message = "Search for a city to add.") {
  if (!results.length) {
    els.searchResults.innerHTML = `<div class="list-item"><div><strong>${escapeHtml(message)}</strong><span>QuickWeather will save the city after you add it.</span></div></div>`;
    return;
  }

  els.searchResults.innerHTML = results.map((city) => `
    <div class="list-item">
      <div>
        <strong>${escapeHtml(city.name)}</strong>
        <span>${escapeHtml([city.admin1, city.country].filter(Boolean).join(", "))}</span>
      </div>
      <button class="primary-btn" type="button" data-add-city="${escapeHtml(JSON.stringify(city))}">Add</button>
    </div>
  `).join("");
}

function renderRemoveList() {
  if (!state.cities.length) {
    els.removeCityList.innerHTML = `<div class="list-item"><div><strong>No saved cities</strong><span>Add a city from the menu first.</span></div></div>`;
    return;
  }

  els.removeCityList.innerHTML = state.cities.map((city) => `
    <div class="list-item">
      <div>
        <strong>${escapeHtml(city.name)} ${city.id === state.defaultCityId ? "★" : ""}</strong>
        <span>${escapeHtml([city.admin1, city.country].filter(Boolean).join(", "))}</span>
      </div>
      <button class="danger-btn" type="button" data-remove-city="${escapeHtml(city.id)}">Remove</button>
    </div>
  `).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function weatherIconSvg(code, isDay) {
  let icon = "⛈️";
  if (code === 0) icon = isDay ? "☀️" : "🌙";
  else if (code <= 3) icon = "⛅";
  else if (code <= 48) icon = "☁️";
  else if (code <= 65) icon = "🌧️";
  else if (code <= 77) icon = "❄️";
  else if (code <= 82) icon = "🚿";
  else if (code <= 86) icon = "🌨️";

  return `<span class="weather-emoji" aria-hidden="true">${icon}</span>`;
}

/* --------------------------------------------------------------- network */

function normalizeWeatherResponse(data) {
  if (data?.current && data?.hourly && data?.daily) return data;

  const currentWeather = data?.current_weather || {};
  const hourly = data?.hourly || {};
  const daily = data?.daily || {};
  const currentTime = currentWeather.time || pickArray(hourly, ["time"])[0] || "";
  const currentIndex = pickArray(hourly, ["time"]).findIndex((time) => time === currentTime);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;

  return {
    ...data,
    current: {
      time: currentTime,
      temperature_2m: currentWeather.temperature,
      apparent_temperature: pickArray(hourly, ["apparent_temperature"])[safeIndex],
      relative_humidity_2m: pickArray(hourly, ["relativehumidity_2m", "relative_humidity_2m"])[safeIndex],
      wind_speed_10m: currentWeather.windspeed ?? pickArray(hourly, ["windspeed_10m", "wind_speed_10m"])[safeIndex],
      wind_direction_10m: currentWeather.winddirection,
      wind_gusts_10m: pickArray(hourly, ["windgusts_10m", "wind_gusts_10m"])[safeIndex],
      uv_index: pickArray(hourly, ["uv_index"])[safeIndex],
      is_day: currentWeather.is_day,
      weather_code: currentWeather.weathercode
    },
    hourly: {
      ...hourly,
      weather_code: pickArray(hourly, ["weather_code", "weathercode"]),
      wind_speed_10m: pickArray(hourly, ["wind_speed_10m", "windspeed_10m"]),
      wind_direction_10m: pickArray(hourly, ["wind_direction_10m", "winddirection_10m"]),
      precipitation_probability: pickArray(hourly, ["precipitation_probability"])
    },
    daily: {
      ...daily,
      weather_code: pickArray(daily, ["weather_code", "weathercode"]),
      precipitation_probability_max: pickArray(daily, ["precipitation_probability_max"])
    }
  };
}

async function fetchWeatherForCity(city) {
  const modernParams = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,is_day,weather_code",
    hourly: "temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation_probability",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max",
    temperature_unit: state.units,
    wind_speed_unit: windApiUnit(),
    timezone: "auto",
    forecast_days: "14"
  });

  try {
    const modernResponse = await fetch(`https://api.open-meteo.com/v1/forecast?${modernParams.toString()}`, { cache: "no-store" });
    if (!modernResponse.ok) throw new Error("modern fetch failed");
    return normalizeWeatherResponse(await modernResponse.json());
  } catch {
    const legacyParams = new URLSearchParams({
      latitude: String(city.latitude),
      longitude: String(city.longitude),
      current_weather: "true",
      daily: "weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset",
      hourly: "temperature_2m,relativehumidity_2m,apparent_temperature,windspeed_10m,winddirection_10m,windgusts_10m,uv_index,weathercode",
      temperature_unit: state.units,
      windspeed_unit: windApiUnit(),
      timezone: "auto",
      forecast_days: "14"
    });

    const legacyResponse = await fetch(`https://api.open-meteo.com/v1/forecast?${legacyParams.toString()}`, { cache: "no-store" });
    if (!legacyResponse.ok) throw new Error("Unable to load weather right now.");
    return normalizeWeatherResponse(await legacyResponse.json());
  }
}

async function refreshActiveWeather() {
  const city = getActiveCity();
  if (!city || pendingWeatherRefresh.has(city.id)) return;

  pendingWeatherRefresh.add(city.id);
  weatherErrors.delete(city.id);
  renderShell();

  try {
    let resolvedCity = city;

    if (!hasValidCoordinates(resolvedCity)) {
      const results = await searchCities(resolvedCity.name);
      const fallbackMatch = results.find((item) => item.name.toLowerCase() === resolvedCity.name.toLowerCase()) || results[0];
      if (!fallbackMatch) throw new Error(`Unable to locate ${resolvedCity.name}.`);

      setState((draft) => {
        const target = draft.cities.find((item) => item.id === city.id);
        if (target) {
          target.latitude = Number(fallbackMatch.latitude);
          target.longitude = Number(fallbackMatch.longitude);
          target.admin1 = fallbackMatch.admin1 || target.admin1;
          target.country = fallbackMatch.country || target.country;
          target.timezone = fallbackMatch.timezone || target.timezone;
        }
      });

      resolvedCity = state.cities.find((item) => item.id === city.id) || {
        ...resolvedCity,
        latitude: Number(fallbackMatch.latitude),
        longitude: Number(fallbackMatch.longitude)
      };
    }

    const weather = await fetchWeatherForCity(resolvedCity);
    setState((draft) => {
      const target = draft.cities.find((item) => item.id === city.id);
      if (target) {
        target.weather = weather;
        target.fetchedAt = Date.now();
      }
    });
  } catch (error) {
    weatherErrors.set(city.id, error.message || "Weather update failed.");
    setStatus(error.message || "Weather update failed.");
    renderShell();
  } finally {
    pendingWeatherRefresh.delete(city.id);
  }
}

async function reverseGeocode(lat, lon) {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: "jsonv2",
    zoom: "10",
    addressdetails: "1"
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to detect city name.");
  const data = await response.json();
  const address = data.address || {};
  return {
    name: address.city || address.town || address.village || address.municipality || address.county || "Current Location",
    admin1: address.state || address.region || "",
    country: address.country || "",
    latitude: lat,
    longitude: lon,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}

async function searchCities(query) {
  const params = new URLSearchParams({
    name: query,
    count: "8",
    language: "en",
    format: "json"
  });
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Search failed.");
  const data = await response.json();
  return (data.results || []).map((result) => ({
    name: result.name,
    admin1: result.admin1 || "",
    country: result.country || "",
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone || "auto"
  }));
}

/* ---------------------------------------------------------- city actions */

async function addCity(city, makeDefault = false) {
  const normalized = normalizeCity(city);
  if (state.cities.some((entry) => entry.id === normalized.id)) {
    setStatus(`${normalized.name} is already saved.`);
    closeModal(els.searchModal);
    return;
  }

  setState((draft) => {
    draft.cities.push(normalized);
    draft.activeCityId = normalized.id;
    if (!draft.defaultCityId || makeDefault) draft.defaultCityId = normalized.id;
  });

  closeModal(els.searchModal);
  setStatus(`${normalized.name} added.`);
  await refreshActiveWeather();
}

function removeCity(id) {
  if (state.cities.length <= 1) {
    setStatus("Keep at least one city saved.");
    return;
  }

  setState((draft) => {
    draft.cities = draft.cities.filter((city) => city.id !== id);
    if (draft.defaultCityId === id) draft.defaultCityId = draft.cities[0]?.id || null;
    if (draft.activeCityId === id) draft.activeCityId = draft.defaultCityId || draft.cities[0]?.id || null;
  });
  renderRemoveList();
}

function setDefaultCity(id) {
  setState((draft) => {
    draft.defaultCityId = id;
    draft.activeCityId = id;
  });
  setStatus("Default city updated.");
}

function playSwipeTransition(direction) {
  if (prefersReducedMotion) return;
  const className = direction === "left" ? "is-swiping-left" : "is-swiping-right";
  els.screen.classList.remove("is-swiping-left", "is-swiping-right");
  void els.screen.offsetWidth;
  els.screen.classList.add(className);
  window.setTimeout(() => els.screen.classList.remove(className), 360);
}

function swipeCity(direction) {
  if (state.cities.length < 2) return;
  const index = state.cities.findIndex((city) => city.id === state.activeCityId);
  const nextIndex = direction === "left"
    ? (index + 1) % state.cities.length
    : (index - 1 + state.cities.length) % state.cities.length;

  displayedTemp = null;
  playSwipeTransition(direction);
  setState((draft) => {
    draft.activeCityId = draft.cities[nextIndex].id;
  });

  const next = getActiveCity();
  if (!next?.weather || Date.now() - (next.fetchedAt || 0) > STALE_AFTER_MS) refreshActiveWeather();
}

function toggleUnits() {
  setState((draft) => {
    draft.units = draft.units === "celsius" ? "fahrenheit" : "celsius";
    // Cached readings are in the old unit, so drop them rather than show mixed numbers.
    draft.cities.forEach((city) => {
      city.weather = null;
      city.fetchedAt = 0;
    });
  });
  displayedTemp = null;
  refreshActiveWeather();
}

async function shareApp() {
  closeMenu();
  const shareData = {
    title: "QuickWeather",
    text: "QuickWeather - swipe-first weather",
    url: window.location.href.split("?")[0]
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(shareData.url);
    setStatus("Link copied to clipboard.");
  } catch {
    setStatus("Sharing is unavailable here.");
  }
}

async function forceRefreshPage() {
  closeMenu();
  closeAllModals();
  setStatus("Reloading app...", 1200);

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
  } catch {
    // Ignore cleanup failures and still reload.
  }

  window.location.replace(`./index.html?reload=${Date.now()}`);
}

/* -------------------------------------------------------- service worker */

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js");

      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            els.updateToast.classList.remove("hidden");
          }
        });
      });

      registration.update();
    } catch {
      // The app still works online when service worker registration is unavailable.
    }
  });
}

/* ----------------------------------------------------------------- events */

function bindEvents() {
  els.menuBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu();
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".menu-wrap")) closeMenu();

    const menuButton = event.target.closest("[data-menu-action]");
    if (menuButton) {
      const action = menuButton.dataset.menuAction;
      if (action === "add-city") {
        renderSearchResults();
        openModal(els.searchModal);
        els.citySearchInput.focus();
      }
      if (action === "refresh-data") {
        closeMenu();
        setStatus("Refreshing weather...", 1200);
        refreshActiveWeather();
        return;
      }
      if (action === "refresh-page") {
        forceRefreshPage();
        return;
      }
      if (action === "toggle-units") {
        closeMenu();
        toggleUnits();
      }
      if (action === "remove-city") {
        renderRemoveList();
        openModal(els.removeModal);
      }
      if (action === "share") {
        shareApp();
        return;
      }
      if (action === "about") openModal(els.aboutModal);
    }

    const closeButton = event.target.closest("[data-close-modal]");
    if (closeButton) closeModal(document.getElementById(closeButton.dataset.closeModal));

    const addCityButton = event.target.closest("[data-add-city]");
    if (addCityButton) addCity(JSON.parse(addCityButton.dataset.addCity));

    const removeCityButton = event.target.closest("[data-remove-city]");
    if (removeCityButton) removeCity(removeCityButton.dataset.removeCity);
  });

  els.modalBackdrop.addEventListener("click", closeAllModals);

  els.updateReloadBtn.addEventListener("click", () => window.location.reload());

  els.themeToggleBtn.addEventListener("click", () => {
    setState((draft) => {
      draft.theme = draft.theme === "dark" ? "light" : "dark";
    });
  });

  els.defaultStar.addEventListener("click", () => {
    const activeCity = getActiveCity();
    if (activeCity) setDefaultCity(activeCity.id);
  });

  els.searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const query = els.citySearchInput.value.trim();
    if (!query) {
      renderSearchResults([], "Enter a city name first.");
      return;
    }

    renderSearchResults([], "Searching...");
    try {
      const results = await searchCities(query);
      renderSearchResults(results, `No results for "${query}".`);
    } catch (error) {
      renderSearchResults([], error.message || "Search failed.");
    }
  });

  els.citySwipeZone.addEventListener("touchstart", (event) => {
    if (document.querySelector(".modal:not(.hidden)")) return;
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();
    pullArmed = false;
  }, { passive: true });

  els.citySwipeZone.addEventListener("touchmove", (event) => {
    if (document.querySelector(".modal:not(.hidden)")) return;
    const touch = event.changedTouches[0];
    const deltaY = touch.clientY - touchStartY;
    const deltaX = touch.clientX - touchStartX;
    const armed = els.screen.scrollTop <= 2 && deltaY > 70 && deltaY > Math.abs(deltaX) * 1.2;
    if (armed !== pullArmed) {
      pullArmed = armed;
      els.refreshHint.classList.toggle("is-armed", armed);
    }
  }, { passive: true });

  els.citySwipeZone.addEventListener("touchend", (event) => {
    if (document.querySelector(".modal:not(.hidden)")) return;
    els.refreshHint.classList.remove("is-armed");

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    const elapsed = Date.now() - touchStartTime;

    if (pullArmed && elapsed < 1600) {
      pullArmed = false;
      setStatus("Refreshing weather...", 1200);
      refreshActiveWeather();
      return;
    }
    pullArmed = false;

    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
    swipeCity(deltaX < 0 ? "left" : "right");
  }, { passive: true });

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    // The temperature ribbon is drawn in pixel units, so it has to be rebuilt on rotation.
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(renderShell, 220);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopSky();
      return;
    }
    startSky();
    const city = getActiveCity();
    if (city && Date.now() - (city.fetchedAt || 0) > STALE_AFTER_MS) refreshActiveWeather();
  });
}

/* ------------------------------------------------------------------- boot */

async function setupInitialCity() {
  if (state.cities.length) {
    if (!state.activeCityId) {
      state.activeCityId = state.defaultCityId || state.cities[0].id;
      saveState();
    }
    renderShell();
    await refreshActiveWeather();
    return;
  }

  renderShell();
  try {
    const position = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation unavailable."));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      });
    });

    const city = await reverseGeocode(position.coords.latitude, position.coords.longitude);
    await addCity(city, true);
  } catch {
    await addCity(FALLBACK_CITY, true);
    setStatus("Location unavailable. Loaded Calgary instead.");
  }
}

initSky();
bindEvents();
renderSearchResults();
renderShell();
registerServiceWorker();
setupInitialCity();
