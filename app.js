const APP_VERSION = "2026.07.31.02";
const STORAGE_KEY = "quickweather_v1_1";
const STALE_AFTER_MS = 10 * 60 * 1000;
const AIR_STALE_AFTER_MS = 30 * 60 * 1000;

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

const SNOW_CODES = [71, 73, 75, 77, 85, 86];
const STORM_CODES = [95, 96, 99];
const RAIN_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82];

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

const AQI_BANDS = [
  [50, "Good", "#63e6a8"],
  [100, "Moderate", "#ffd84d"],
  [150, "Unhealthy for sensitive groups", "#ffa14d"],
  [200, "Unhealthy", "#ff7f72"],
  [300, "Very unhealthy", "#a78bfa"],
  [Infinity, "Hazardous", "#b4436c"]
];

const METRIC_SPECS = {
  feels: { title: "Feels like", key: "apparent", suffix: "°", decimals: 0 },
  humidity: { title: "Humidity", key: "humidity", suffix: "%", decimals: 0 },
  uv: { title: "UV index", key: "uv", suffix: "", decimals: 1 },
  precip: { title: "Precipitation chance", key: "precipProb", suffix: "%", decimals: 0 }
};

const els = {
  body: document.body,
  themeColorMeta: document.getElementById("theme-color-meta"),
  skyCanvas: document.getElementById("sky-canvas"),
  screen: document.getElementById("screen"),
  cityName: document.getElementById("city-name"),
  cityDots: document.getElementById("city-dots"),
  alertRow: document.getElementById("alert-row"),
  defaultStar: document.getElementById("default-star"),
  themeToggleBtn: document.getElementById("theme-toggle-btn"),
  menuBtn: document.getElementById("menu-btn"),
  menuPanel: document.getElementById("menu-panel"),
  unitsMenuBtn: document.getElementById("units-menu-btn"),
  viewContext: document.getElementById("view-context"),
  viewContextText: document.getElementById("view-context-text"),
  currentIcon: document.getElementById("current-icon"),
  currentTemp: document.getElementById("current-temp"),
  currentUnit: document.getElementById("current-unit"),
  currentCondition: document.getElementById("current-condition"),
  currentSummary: document.getElementById("current-summary"),
  tempTrackMarker: document.getElementById("temp-track-marker"),
  tempTrackCaption: document.getElementById("temp-track-caption"),
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
  precipChance: document.getElementById("precip-chance"),
  statsGrid: document.getElementById("stats-grid"),
  metricDetail: document.getElementById("metric-detail"),
  metricDetailTitle: document.getElementById("metric-detail-title"),
  metricDetailRange: document.getElementById("metric-detail-range"),
  metricSparkline: document.getElementById("metric-sparkline"),
  sunArc: document.getElementById("sun-arc"),
  daylightRemaining: document.getElementById("daylight-remaining"),
  sunrise: document.getElementById("sunrise"),
  sunset: document.getElementById("sunset"),
  precipHeadline: document.getElementById("precip-headline"),
  precipBars: document.getElementById("precip-bars"),
  airCard: document.getElementById("air-card"),
  airNote: document.getElementById("air-note"),
  airIndex: document.getElementById("air-index"),
  airCategory: document.getElementById("air-category"),
  airDetail: document.getElementById("air-detail"),
  airMarker: document.getElementById("air-marker"),
  hourlyTitle: document.getElementById("hourly-title"),
  tempRibbon: document.getElementById("temp-ribbon"),
  hourlyForecast: document.getElementById("hourly-forecast"),
  dailyForecast: document.getElementById("daily-forecast"),
  versionLabel: document.getElementById("version-label"),
  updatedLabel: document.getElementById("updated-label"),
  aboutVersion: document.getElementById("about-version"),
  statusBanner: document.getElementById("status-banner"),
  pullIndicator: document.getElementById("pull-indicator"),
  pullProgress: document.getElementById("pull-progress"),
  updateToast: document.getElementById("update-toast"),
  updateReloadBtn: document.getElementById("update-reload-btn"),
  citySwipeZone: document.getElementById("city-swipe-zone"),
  modalBackdrop: document.getElementById("modal-backdrop"),
  searchModal: document.getElementById("search-modal"),
  manageModal: document.getElementById("manage-modal"),
  aboutModal: document.getElementById("about-modal"),
  searchForm: document.getElementById("search-form"),
  citySearchInput: document.getElementById("city-search-input"),
  searchResults: document.getElementById("search-results"),
  manageCityList: document.getElementById("manage-city-list")
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const PULL_CIRCUMFERENCE = 2 * Math.PI * 15;
const PULL_DISTANCE = 110;

let state = loadState();
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let pullDistance = 0;
let pullArmed = false;
let displayedTemp = null;
let tempAnimation = 0;

// View state is deliberately not persisted; every launch opens on live conditions.
let viewDayIndex = 0;
let scrubIndex = null;
let scrubLocked = false;
let openMetric = null;
let currentFrame = null;
let ribbonPoints = [];
let lastSkyHourKey = "";

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

function haptic(duration = 8) {
  if (prefersReducedMotion || !navigator.vibrate) return;
  try {
    navigator.vibrate(duration);
  } catch {
    // Vibration is best effort and blocked in some contexts.
  }
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
    air: city.air || null,
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

function formatDuration(minutes) {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (!hours) return `${mins}m`;
  return `${hours}h ${String(mins).padStart(2, "0")}m`;
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

function formatDay(iso, style = "short") {
  const [year, month, day] = String(iso).split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return "--";
  const stableDate = new Date(Date.UTC(year, month - 1, day, 12));
  const options = style === "weekday"
    ? { weekday: "long", timeZone: "UTC" }
    : { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" };
  return new Intl.DateTimeFormat(undefined, options).format(stableDate);
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

function isoToMinutes(iso) {
  const timePart = String(iso).split("T")[1] || "";
  const [hourText, minuteText] = timePart.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour)) return null;
  return hour * 60 + (Number.isFinite(minute) ? minute : 0);
}

function localNow(weather) {
  const offset = Number(weather?.utc_offset_seconds);
  return Number.isFinite(offset) ? new Date(Date.now() + offset * 1000) : new Date();
}

function localNowMinutes(weather) {
  const date = localNow(weather);
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

function currentHourIso(weather) {
  const date = localNow(weather);
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
  if (STORM_CODES.includes(code)) return "storm";
  if (SNOW_CODES.includes(code)) return "snow";
  if (RAIN_CODES.includes(code)) return "rain";
  if ([1, 2, 3, 45, 48].includes(code)) return "cloud";
  return "clear";
}

// Precipitation keeps falling after dark, so the canvas needs the weather on its own.
function precipMode(code) {
  if (STORM_CODES.includes(code)) return "storm";
  if (SNOW_CODES.includes(code)) return "snow";
  if (RAIN_CODES.includes(code)) return "rain";
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
  gustBoost: 0,
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
  return (26 + Math.min(sky.windSpeedKmh, 90) * 3.4) * (1 + sky.gustBoost * 1.6);
}

function makeStreak(offscreen = false) {
  return {
    x: random(offscreen ? -0.35 : -0.1, offscreen ? -0.05 : 1.1) * sky.width,
    y: random(0, 1) * sky.height,
    length: random(28, 120),
    alpha: random(0.06, 0.24),
    speed: random(0.65, 1.5),
    temporary: offscreen
  };
}

function seedStreaks() {
  const target = Math.round(Math.min(70, 16 + sky.windSpeedKmh * 1.15));
  sky.streaks = Array.from({ length: target }, () => makeStreak());
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

  for (let index = sky.streaks.length - 1; index >= 0; index -= 1) {
    const streak = sky.streaks[index];
    streak.x += vector.x * speed * streak.speed * delta;
    streak.y += vector.y * speed * streak.speed * delta;

    const offscreen =
      streak.x < -margin || streak.x > sky.width + margin || streak.y < -margin || streak.y > sky.height + margin;

    if (offscreen) {
      // Extra streaks spawned by a tap are retired once they leave; the rest wrap around.
      if (streak.temporary) {
        sky.streaks.splice(index, 1);
        continue;
      }
      if (streak.x < -margin) streak.x = sky.width + margin;
      if (streak.x > sky.width + margin) streak.x = -margin;
      if (streak.y < -margin) streak.y = sky.height + margin;
      if (streak.y > sky.height + margin) streak.y = -margin;
    }

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
  if (sky.gustBoost > 0) sky.gustBoost = Math.max(0, sky.gustBoost - delta * 0.6);
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

function triggerGust() {
  if (!sky.ctx || prefersReducedMotion) return;
  sky.gustBoost = Math.min(1.6, sky.gustBoost + 1);
  for (let index = 0; index < 18; index += 1) sky.streaks.push(makeStreak(true));
  haptic(6);
}

/* -------------------------------------------------------- number animation */

function setTemperature(target, animate) {
  const next = Number(target);
  window.cancelAnimationFrame(tempAnimation);

  if (!Number.isFinite(next)) {
    displayedTemp = null;
    els.currentTemp.textContent = "--";
    return;
  }

  if (!animate || prefersReducedMotion || displayedTemp == null || Math.round(displayedTemp) === Math.round(next)) {
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

/* ------------------------------------------------------------ chart helpers */

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

/* ---------------------------------------------------------------- the frame */

function hourEntry(hourly, index) {
  return {
    index,
    time: pickArray(hourly, ["time"])[index],
    temperature: pickArray(hourly, ["temperature_2m"])[index],
    apparent: pickArray(hourly, ["apparent_temperature"])[index],
    humidity: pickArray(hourly, ["relative_humidity_2m", "relativehumidity_2m"])[index],
    uv: pickArray(hourly, ["uv_index"])[index],
    wind: pickArray(hourly, ["wind_speed_10m", "windspeed_10m"])[index],
    gust: pickArray(hourly, ["wind_gusts_10m", "windgusts_10m"])[index],
    windDirection: pickArray(hourly, ["wind_direction_10m", "winddirection_10m"])[index],
    code: pickArray(hourly, ["weather_code", "weathercode"])[index],
    precipProb: pickArray(hourly, ["precipitation_probability"])[index],
    precip: pickArray(hourly, ["precipitation"])[index],
    isDay: pickArray(hourly, ["is_day"])[index]
  };
}

function buildFrame(city) {
  const weather = city.weather;
  const hourly = weather.hourly;
  const daily = weather.daily;
  const hourlyTime = pickArray(hourly, ["time"]);
  const dailyTime = pickArray(daily, ["time"]);
  const todayStart = getCurrentHourIndex(hourlyTime, weather.current, weather);

  let windowStart = todayStart;
  if (viewDayIndex > 0 && dailyTime[viewDayIndex]) {
    const found = hourlyTime.findIndex((time) => String(time).startsWith(dailyTime[viewDayIndex]));
    if (found >= 0) windowStart = found;
  }

  const hours = [];
  for (let offset = 0; offset < 24; offset += 1) {
    const index = windowStart + offset;
    if (index >= hourlyTime.length) break;
    hours.push(hourEntry(hourly, index));
  }

  const todayHours = [];
  for (let offset = 0; offset < 24; offset += 1) {
    const index = todayStart + offset;
    if (index >= hourlyTime.length) break;
    todayHours.push(hourEntry(hourly, index));
  }

  return {
    city,
    weather,
    hourly,
    daily,
    dailyTime,
    dailyCodes: pickArray(daily, ["weather_code", "weathercode"]),
    dailyHighs: pickArray(daily, ["temperature_2m_max"]),
    dailyLows: pickArray(daily, ["temperature_2m_min"]),
    dailySunrise: pickArray(daily, ["sunrise"]),
    dailySunset: pickArray(daily, ["sunset"]),
    dailyPrecipMax: pickArray(daily, ["precipitation_probability_max"]),
    hours,
    todayHours,
    todayStart,
    windowStart
  };
}

function liveSource(frame) {
  const current = frame.weather.current;
  const firstHour = frame.todayHours[0] || {};
  return {
    temperature: current.temperature_2m,
    apparent: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    uv: current.uv_index,
    wind: current.wind_speed_10m,
    gust: current.wind_gusts_10m,
    windDirection: current.wind_direction_10m,
    code: current.weather_code,
    isDay: current.is_day,
    precipProb: firstHour.precipProb,
    time: current.time
  };
}

function activeSource(frame) {
  if (scrubIndex != null && frame.hours[scrubIndex]) return frame.hours[scrubIndex];
  if (viewDayIndex > 0) return frame.hours[12] || frame.hours[0] || liveSource(frame);
  return liveSource(frame);
}

function isLiveView() {
  return viewDayIndex === 0 && scrubIndex == null;
}

/* --------------------------------------------------------------- rendering */

function openModal(modal) {
  els.modalBackdrop.classList.remove("hidden");
  modal.classList.remove("hidden");
  closeMenu();
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.add("hidden");
  const anyOpen = [els.searchModal, els.manageModal, els.aboutModal].some((node) => !node.classList.contains("hidden"));
  if (!anyOpen) els.modalBackdrop.classList.add("hidden");
}

function closeAllModals() {
  [els.searchModal, els.manageModal, els.aboutModal].forEach((modal) => modal.classList.add("hidden"));
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
  currentFrame = null;
  ribbonPoints = [];
  els.body.dataset.sky = "cloud";
  els.themeColorMeta.setAttribute("content", themeChromeColor(state.theme, "cloud"));
  applyTempTheme(null);
  els.currentIcon.innerHTML = weatherIconSvg(2, true);
  displayedTemp = null;
  els.currentTemp.textContent = "--";
  els.currentUnit.textContent = unitSuffix();
  els.currentCondition.textContent = condition;
  els.currentSummary.textContent = summary;
  els.viewContext.classList.add("hidden");
  els.alertRow.innerHTML = "";
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
  els.precipChance.textContent = "--";
  els.metricDetail.classList.add("hidden");
  els.sunArc.innerHTML = "";
  els.daylightRemaining.textContent = "";
  els.sunrise.textContent = "--";
  els.sunset.textContent = "--";
  els.precipHeadline.textContent = "--";
  els.precipBars.innerHTML = "";
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

function buildHeroSummary(source, frame) {
  const bits = [];
  if (!isMissing(source.wind)) {
    bits.push(`${compassDirection(source.windDirection)} wind at ${formatWind(source.wind)}`);
  }
  if (!isMissing(source.gust)) bits.push(`gusts ${formatWind(source.gust)}`);
  if (!isMissing(source.humidity)) bits.push(`${Math.round(Number(source.humidity))}% humidity`);
  const precip = isMissing(source.precipProb) ? frame.dailyPrecipMax[viewDayIndex] : source.precipProb;
  if (!isMissing(precip)) bits.push(`${Math.round(Number(precip))}% chance of precipitation`);
  return bits.join(" • ");
}

function dayLabelForIndex(frame, index) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  return formatDay(frame.dailyTime[index], "weekday");
}

// A 24 hour window rolls past midnight, so name the day the hour actually falls on.
function dayLabelForIso(frame, iso) {
  const date = String(iso).split("T")[0];
  const index = frame.dailyTime.indexOf(date);
  if (index >= 0) return dayLabelForIndex(frame, index);
  return formatDay(date, "weekday");
}

function renderViewContext(frame) {
  if (isLiveView()) {
    els.viewContext.classList.add("hidden");
    return;
  }

  if (scrubIndex != null && frame.hours[scrubIndex]) {
    const hour = frame.hours[scrubIndex];
    els.viewContextText.textContent = `${dayLabelForIso(frame, hour.time)} at ${formatHourLabel(hour.time)}`;
  } else {
    els.viewContextText.textContent = `${dayLabelForIndex(frame, viewDayIndex)} · midday`;
  }
  els.viewContext.classList.remove("hidden");
}

function renderHeroPanel(frame, { animateTemp = true } = {}) {
  const source = activeSource(frame);
  const live = isLiveView();
  const accent = applyTempTheme(source.temperature);
  const currentSky = skyMode(source.code, Boolean(source.isDay));

  els.body.dataset.sky = currentSky;
  els.themeColorMeta.setAttribute("content", themeChromeColor(state.theme, currentSky));
  els.currentIcon.innerHTML = weatherIconSvg(source.code, Boolean(source.isDay));
  setTemperature(source.temperature, animateTemp && live);
  els.currentUnit.textContent = unitSuffix();
  els.currentCondition.textContent = weatherLabel(source.code);
  els.currentSummary.textContent = buildHeroSummary(source, frame);

  const dayLow = Number(frame.dailyLows[viewDayIndex]);
  const dayHigh = Number(frame.dailyHighs[viewDayIndex]);
  const value = Number(source.temperature);
  els.todayLow.textContent = formatTemperature(dayLow);
  els.todayHigh.textContent = formatTemperature(dayHigh);
  els.tempTrackCaption.textContent = viewDayIndex === 0 ? "Today's range" : "Day range";
  if (Number.isFinite(dayLow) && Number.isFinite(dayHigh) && dayHigh > dayLow && Number.isFinite(value)) {
    const ratio = (value - dayLow) / (dayHigh - dayLow);
    els.tempTrackMarker.style.left = `${Math.min(Math.max(ratio, 0), 1) * 100}%`;
  } else {
    els.tempTrackMarker.style.left = "50%";
  }

  els.windSpeed.textContent = isMissing(source.wind) ? "--" : String(Math.round(Number(source.wind)));
  els.windSpeedUnit.textContent = windUnit();
  els.windBeaufort.textContent = beaufortLabel(source.wind);
  els.windDirection.textContent = isMissing(source.windDirection)
    ? "--"
    : `${compassDirection(source.windDirection)} ${Math.round(Number(source.windDirection))}°`;
  els.windGust.textContent = formatGust(source.gust);
  els.windCompassNeedle.style.setProperty("--wind-rotation", `${Number(source.windDirection) || 0}deg`);

  const windKmh = toKmh(source.wind) ?? 0;
  const rotorSeconds = Math.max(0.35, 14 - Math.min(windKmh, 80) * 0.16);
  els.body.style.setProperty("--rotor-duration", `${rotorSeconds.toFixed(2)}s`);

  const gustKmh = toKmh(source.gust);
  els.gustFill.style.width = `${Math.min(windKmh / 80, 1) * 100}%`;
  if (gustKmh != null && gustKmh > windKmh) {
    els.gustPeak.classList.add("is-visible");
    els.gustPeak.style.left = `${Math.min(gustKmh / 80, 1) * 100}%`;
  } else {
    els.gustPeak.classList.remove("is-visible");
  }

  els.feelsLike.textContent = formatTemperature(source.apparent);
  els.humidity.textContent = isMissing(source.humidity) ? "--" : `${Math.round(Number(source.humidity))}%`;
  els.uvIndex.textContent = isMissing(source.uv) ? "--" : String(Math.round(Number(source.uv) * 10) / 10);
  els.precipChance.textContent = isMissing(source.precipProb) ? "--" : `${Math.round(Number(source.precipProb))}%`;

  const skyKey = `${currentSky}|${Math.round(windKmh)}|${Math.round(Number(source.windDirection) || 0)}`;
  if (skyKey !== lastSkyHourKey) {
    lastSkyHourKey = skyKey;
    updateSky({
      mode: precipMode(source.code) || currentSky,
      windSpeed: source.wind,
      windDirection: source.windDirection,
      accent
    });
  }

  renderViewContext(frame);
}

function renderAlerts(frame) {
  const hours = frame.todayHours;
  if (!hours.length) {
    els.alertRow.innerHTML = "";
    return;
  }

  const alerts = [];
  const numbers = (key) => hours.map((hour) => Number(hour[key])).filter(Number.isFinite);

  const gusts = numbers("gust");
  const maxGust = gusts.length ? Math.max(...gusts) : null;
  if (maxGust != null && (toKmh(maxGust) ?? 0) >= 50) {
    alerts.push({
      color: "#ff7f72",
      label: `Gusts ${Math.round(maxGust)}`,
      detail: `Gusts reach ${formatWind(maxGust)} in the next 24 hours.`
    });
  }

  if (hours.some((hour) => STORM_CODES.includes(Number(hour.code)))) {
    alerts.push({ color: "#a78bfa", label: "Storms", detail: "Thunderstorms are in the next 24 hours." });
  }

  const probs = numbers("precipProb");
  const maxProb = probs.length ? Math.max(...probs) : null;
  if (maxProb != null && maxProb >= 70) {
    const snowy = hours.some((hour) => SNOW_CODES.includes(Number(hour.code)));
    alerts.push({
      color: "#5fe5ff",
      label: snowy ? "Snow likely" : "Rain likely",
      detail: `Precipitation chance peaks at ${Math.round(maxProb)}% today.`
    });
  }

  const uvs = numbers("uv");
  const maxUv = uvs.length ? Math.max(...uvs) : null;
  if (maxUv != null && maxUv >= 8) {
    alerts.push({
      color: "#ffd84d",
      label: `UV ${Math.round(maxUv)}`,
      detail: `UV index peaks at ${Math.round(maxUv)} today. Cover up around midday.`
    });
  }

  const high = Number(frame.dailyHighs[0]);
  const low = Number(frame.dailyLows[0]);
  const highC = toCelsius(high);
  const lowC = toCelsius(low);
  if (lowC != null && lowC <= -20) {
    alerts.push({ color: "#7c6cff", label: "Extreme cold", detail: `Low of ${formatTemperature(low)} today.` });
  } else if (highC != null && highC >= 32) {
    alerts.push({ color: "#ff4d6d", label: "Heat", detail: `High of ${formatTemperature(high)} today.` });
  }

  if (highC != null && lowC != null && highC - lowC >= 15) {
    alerts.push({
      color: "#63e6a8",
      label: "Big swing",
      detail: `${formatTemperature(low)} to ${formatTemperature(high)} today — a ${Math.round(highC - lowC)}°C swing.`
    });
  }

  els.alertRow.innerHTML = alerts
    .slice(0, 3)
    .map(
      (alert) =>
        `<button class="alert-chip" type="button" style="--chip-color: ${alert.color}" data-alert="${escapeHtml(alert.detail)}">${escapeHtml(alert.label)}</button>`
    )
    .join("");
}

function renderTempRibbon(frame) {
  const hours = frame.hours;
  const temps = hours.map((hour) => Number(hour.temperature)).filter(Number.isFinite);
  if (hours.length < 2 || temps.length < 2) {
    els.tempRibbon.innerHTML = "";
    ribbonPoints = [];
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
  ribbonPoints = points;

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
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Temperature over 24 hours. Drag to preview an hour.">
      <defs>
        <linearGradient id="ribbonStroke" x1="0" y1="0" x2="1" y2="0">${strokeStops}</linearGradient>
        <linearGradient id="ribbonFill" x1="0" y1="0" x2="0" y2="1">${fillStops}</linearGradient>
      </defs>
      ${ticks}
      <path class="ribbon-area" d="${area}" />
      <path class="ribbon-line" d="${line}" />
      <line class="scrub-line" id="scrub-line" x1="0" y1="${top - 8}" x2="0" y2="${bottom + 8}" />
      <circle class="ribbon-now" cx="${nowPoint.x.toFixed(1)}" cy="${nowPoint.y.toFixed(1)}" r="3.5" />
      <circle class="scrub-dot" id="scrub-dot" cx="0" cy="0" r="5" />
      <text class="ribbon-label" x="${clampX(maxPoint.x)}" y="${(maxPoint.y - 8).toFixed(1)}" text-anchor="middle">${formatTemperature(maxPoint.value)}</text>
      <text class="ribbon-label" x="${clampX(minPoint.x)}" y="${(minPoint.y + 14).toFixed(1)}" text-anchor="middle">${formatTemperature(minPoint.value)}</text>
    </svg>
  `;

  const path = els.tempRibbon.querySelector(".ribbon-line");
  if (path && typeof path.getTotalLength === "function") {
    path.style.setProperty("--ribbon-length", String(Math.ceil(path.getTotalLength())));
  }
  positionScrubMarker();
}

function positionScrubMarker() {
  const line = document.getElementById("scrub-line");
  const dot = document.getElementById("scrub-dot");
  if (!line || !dot) return;

  if (scrubIndex == null || !ribbonPoints[scrubIndex]) {
    els.tempRibbon.classList.remove("is-scrubbing");
    return;
  }

  const point = ribbonPoints[scrubIndex];
  line.setAttribute("x1", point.x.toFixed(1));
  line.setAttribute("x2", point.x.toFixed(1));
  dot.setAttribute("cx", point.x.toFixed(1));
  dot.setAttribute("cy", point.y.toFixed(1));
  els.tempRibbon.classList.add("is-scrubbing");
}

function renderHourly(frame) {
  els.hourlyTitle.textContent = viewDayIndex === 0
    ? "24HR Temp + Wind"
    : `${dayLabelForIndex(frame, viewDayIndex)} hour by hour`;

  els.hourlyForecast.innerHTML = frame.hours.map((hour, index) => {
    const isNow = viewDayIndex === 0 && index === 0;
    const selected = scrubIndex === index;
    return `
      <button class="forecast-card${isNow ? " is-now" : ""}${selected ? " is-selected" : ""}" type="button" data-hour="${index}" style="--card-temp: ${tempColor(hour.temperature)}">
        <span class="forecast-label">${isNow ? "Now" : formatHourLabel(hour.time)}</span>
        <span class="forecast-icon">${weatherIconSvg(hour.code, hour.isDay == null ? true : Boolean(Number(hour.isDay)))}</span>
        <span class="forecast-temp">${formatTemperature(hour.temperature)}</span>
        <span class="forecast-sub">${windArrow(hour.windDirection)} ${formatWind(hour.wind)}</span>
        <span class="forecast-direction">${compassDirection(hour.windDirection)}</span>
        <span class="forecast-note">${!isMissing(hour.precipProb) && Number(hour.precipProb) > 0 ? `${Math.round(Number(hour.precipProb))}% precip` : ""}</span>
      </button>
    `;
  }).join("");
}

function renderDaily(frame) {
  const visibleDays = frame.dailyTime.slice(0, 14);
  const dayTemps = [...frame.dailyHighs.slice(0, 14), ...frame.dailyLows.slice(0, 14)].map(Number).filter(Number.isFinite);
  const rangeMax = dayTemps.length ? Math.max(...dayTemps) : 1;
  const rangeMin = dayTemps.length ? Math.min(...dayTemps) : 0;
  const rangeSpan = Math.max(rangeMax - rangeMin, 1);

  els.dailyForecast.innerHTML = visibleDays.map((date, index) => {
    const high = Number(frame.dailyHighs[index]);
    const low = Number(frame.dailyLows[index]);
    const hasRange = Number.isFinite(high) && Number.isFinite(low);
    const barTop = hasRange ? ((rangeMax - high) / rangeSpan) * 100 : 0;
    const barHeight = hasRange ? Math.max(((high - low) / rangeSpan) * 100, 6) : 100;

    return `
      <button class="forecast-card daily-card${index === viewDayIndex ? " is-selected" : ""}" type="button" data-day="${index}" style="--card-high: ${tempColor(high)}; --card-low: ${tempColor(low)}">
        <span class="forecast-label">${index === 0 ? "Today" : formatDay(date)}</span>
        <span class="forecast-icon">${weatherIconSvg(frame.dailyCodes[index], true)}</span>
        <span class="range-bar"><span class="range-bar-fill" style="--bar-top: ${barTop.toFixed(1)}%; --bar-height: ${barHeight.toFixed(1)}%"></span></span>
        <span class="forecast-range"><span class="range-high">${formatTemperature(high)}</span> <span class="range-low">${formatTemperature(low)}</span></span>
        <span class="forecast-note">${!isMissing(frame.dailyPrecipMax[index]) && Number(frame.dailyPrecipMax[index]) > 0 ? `${Math.round(Number(frame.dailyPrecipMax[index]))}%` : ""}</span>
      </button>
    `;
  }).join("");
}

function renderMetricDetail(frame) {
  els.statsGrid.querySelectorAll(".metric").forEach((tile) => {
    tile.classList.toggle("is-open", tile.dataset.metric === openMetric);
  });

  const spec = METRIC_SPECS[openMetric];
  if (!spec) {
    els.metricDetail.classList.add("hidden");
    els.metricSparkline.innerHTML = "";
    return;
  }

  const values = frame.hours.map((hour) => Number(hour[spec.key]));
  const finite = values.filter(Number.isFinite);
  if (finite.length < 2) {
    els.metricDetail.classList.remove("hidden");
    els.metricDetailTitle.textContent = `${spec.title} · next 24h`;
    els.metricDetailRange.textContent = "No data";
    els.metricSparkline.innerHTML = "";
    return;
  }

  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const format = (value) => `${value.toFixed(spec.decimals)}${spec.suffix}`;

  els.metricDetail.classList.remove("hidden");
  els.metricDetailTitle.textContent = `${spec.title} · next 24h`;
  els.metricDetailRange.textContent = `${format(min)} – ${format(max)}`;

  const width = Math.max(els.metricSparkline.clientWidth || 300, 200);
  const height = Math.max(els.metricSparkline.clientHeight || 68, 50);
  const top = 12;
  const bottom = height - 16;
  const span = Math.max(max - min, spec.key === "uv" ? 1 : 2);

  const points = values.map((value, index) => ({
    x: (index / (values.length - 1)) * width,
    y: bottom - ((Number.isFinite(value) ? value - min : 0) / span) * (bottom - top)
  }));

  const line = smoothPath(points);
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  const first = points[0];

  const labels = frame.hours
    .map((hour, index) => ({ hour, index }))
    .filter(({ index }) => index > 0 && index % 8 === 0)
    .map(({ hour, index }) => `<text class="spark-label" x="${points[index].x.toFixed(1)}" y="${height - 2}" text-anchor="middle">${formatHourLabel(hour.time)}</text>`)
    .join("");

  els.metricSparkline.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(spec.title)} over 24 hours">
      <path class="spark-area" d="${area}" />
      <path class="spark-line" d="${line}" />
      <circle class="spark-now" cx="${first.x.toFixed(1)}" cy="${first.y.toFixed(1)}" r="3.5" />
      ${labels}
    </svg>
  `;
}

function renderDaylight(frame) {
  const sunriseIso = frame.dailySunrise[viewDayIndex];
  const sunsetIso = frame.dailySunset[viewDayIndex];
  els.sunrise.textContent = formatClock(sunriseIso);
  els.sunset.textContent = formatClock(sunsetIso);

  const riseMinutes = isoToMinutes(sunriseIso);
  const setMinutes = isoToMinutes(sunsetIso);
  if (riseMinutes == null || setMinutes == null || setMinutes <= riseMinutes) {
    els.sunArc.innerHTML = "";
    els.daylightRemaining.textContent = "";
    return;
  }

  const isToday = viewDayIndex === 0;
  const nowMinutes = localNowMinutes(frame.weather);
  const dayLength = setMinutes - riseMinutes;
  const progress = isToday ? Math.min(Math.max((nowMinutes - riseMinutes) / dayLength, 0), 1) : null;
  const sunIsUp = isToday && nowMinutes >= riseMinutes && nowMinutes <= setMinutes;

  if (!isToday) {
    els.daylightRemaining.textContent = `${formatDuration(dayLength)} of daylight`;
  } else if (nowMinutes < riseMinutes) {
    els.daylightRemaining.textContent = `Sunrise in ${formatDuration(riseMinutes - nowMinutes)}`;
  } else if (nowMinutes > setMinutes) {
    els.daylightRemaining.textContent = `Sun set ${formatDuration(nowMinutes - setMinutes)} ago`;
  } else {
    els.daylightRemaining.textContent = `${formatDuration(setMinutes - nowMinutes)} left`;
  }

  const width = Math.max(els.sunArc.clientWidth || 320, 220);
  const height = Math.max(els.sunArc.clientHeight || 92, 70);
  const padding = 18;
  const radius = (width - padding * 2) / 2;
  const centerX = width / 2;
  const baseY = height - 18;

  const pointAt = (ratio) => {
    const angle = Math.PI - ratio * Math.PI;
    return { x: centerX + radius * Math.cos(angle), y: baseY - radius * Math.sin(angle) * 0.78 };
  };

  const start = pointAt(0);
  const end = pointAt(1);
  const track = `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} A ${radius.toFixed(1)} ${(radius * 0.78).toFixed(1)} 0 0 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;

  let done = "";
  let sunMarker = "";
  if (progress != null && progress > 0) {
    const sun = pointAt(progress);
    done = `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} A ${radius.toFixed(1)} ${(radius * 0.78).toFixed(1)} 0 0 1 ${sun.x.toFixed(1)} ${sun.y.toFixed(1)}`;
    sunMarker = `<circle class="arc-sun${sunIsUp ? "" : " is-down"}" cx="${sun.x.toFixed(1)}" cy="${sun.y.toFixed(1)}" r="6" />`;
  }

  els.sunArc.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Sun position between sunrise and sunset">
      <defs>
        <linearGradient id="arcGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#ff9c6b" />
          <stop offset="50%" stop-color="#ffd84d" />
          <stop offset="100%" stop-color="#ff9c6b" />
        </linearGradient>
      </defs>
      <line class="arc-horizon" x1="${padding - 6}" y1="${baseY}" x2="${width - padding + 6}" y2="${baseY}" />
      <path class="arc-track" d="${track}" />
      ${done ? `<path class="arc-done" d="${done}" />` : ""}
      ${sunMarker}
    </svg>
  `;
}

function renderPrecipitation(frame) {
  const hours = frame.hours.slice(0, 12);
  if (!hours.length) {
    els.precipHeadline.textContent = "--";
    els.precipBars.innerHTML = "";
    return;
  }

  const firstWet = hours.findIndex(
    (hour) => Number(hour.precipProb) >= 40 || Number(hour.precip) > 0.1
  );
  const snowy = hours.some((hour) => SNOW_CODES.includes(Number(hour.code)));
  const word = snowy ? "Snow" : "Rain";
  const total = hours.map((hour) => Number(hour.precip)).filter(Number.isFinite).reduce((sum, value) => sum + value, 0);

  if (firstWet < 0) {
    els.precipHeadline.textContent = "No precipitation expected";
  } else if (firstWet === 0) {
    els.precipHeadline.textContent = `${word} right now${total > 0 ? ` · ${total.toFixed(1)} mm over 12h` : ""}`;
  } else {
    const label = formatHourLabel(hours[firstWet].time);
    const lead = viewDayIndex === 0 ? `in about ${formatDuration(firstWet * 60)}` : "";
    els.precipHeadline.textContent = `${word} likely around ${label}${lead ? ` — ${lead}` : ""}`;
  }

  els.precipBars.innerHTML = hours.map((hour, index) => {
    const probability = Number(hour.precipProb);
    const height = Number.isFinite(probability) ? Math.max(probability, 1.5) : 1.5;
    return `
      <div class="precip-bar">
        <div class="precip-bar-track"><div class="precip-bar-fill" style="--bar-height: ${height.toFixed(0)}%"></div></div>
        <div class="precip-bar-label">${index % 3 === 0 ? formatHourLabel(hour.time) : ""}</div>
      </div>
    `;
  }).join("");
}

function aqiBand(value) {
  for (const [ceiling, label, color] of AQI_BANDS) {
    if (value <= ceiling) return { label, color };
  }
  return { label: "Hazardous", color: "#b4436c" };
}

function renderAir(city) {
  const air = city?.air;
  if (!air || isMissing(air.usAqi)) {
    els.airCard.classList.add("is-unavailable");
    els.airIndex.textContent = "--";
    els.airCategory.textContent = air?.failed ? "Unavailable" : "Loading...";
    els.airDetail.textContent = air?.failed ? "Air quality could not be loaded." : "";
    els.airNote.textContent = "US AQI";
    els.airMarker.style.left = "0%";
    return;
  }

  const value = Math.round(Number(air.usAqi));
  const band = aqiBand(value);
  els.airCard.classList.remove("is-unavailable");
  els.airCard.style.setProperty("--aqi-color", band.color);
  els.airIndex.textContent = String(value);
  els.airCategory.textContent = band.label;
  els.airNote.textContent = "US AQI";

  const parts = [];
  if (!isMissing(air.pm25)) parts.push(`PM2.5 ${Number(air.pm25).toFixed(1)}`);
  if (!isMissing(air.pm10)) parts.push(`PM10 ${Number(air.pm10).toFixed(1)}`);
  els.airDetail.textContent = parts.join(" · ");
  els.airMarker.style.left = `${Math.min(value / 300, 1) * 100}%`;
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
  renderAir(activeCity);

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

  if (viewDayIndex >= pickArray(activeCity.weather.daily, ["time"]).length) viewDayIndex = 0;

  const frame = buildFrame(activeCity);
  currentFrame = frame;
  if (scrubIndex != null && !frame.hours[scrubIndex]) scrubIndex = null;

  renderAlerts(frame);
  renderHeroPanel(frame);
  renderTempRibbon(frame);
  renderHourly(frame);
  renderMetricDetail(frame);
  renderDaylight(frame);
  renderPrecipitation(frame);
  renderDaily(frame);
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

function renderManageList() {
  if (!state.cities.length) {
    els.manageCityList.innerHTML = `<div class="list-item"><div><strong>No saved cities</strong><span>Add a city from the menu first.</span></div></div>`;
    return;
  }

  els.manageCityList.innerHTML = state.cities.map((city) => `
    <div class="manage-item" data-city="${escapeHtml(city.id)}">
      <button class="drag-handle" type="button" data-drag-handle aria-label="Reorder ${escapeHtml(city.name)}">⋮⋮</button>
      <div class="manage-body">
        <strong>${escapeHtml(city.name)}</strong>
        <span>${escapeHtml([city.admin1, city.country].filter(Boolean).join(", "))}</span>
      </div>
      <div class="manage-actions">
        <button class="icon-action${city.id === state.defaultCityId ? " is-default" : ""}" type="button" data-make-default="${escapeHtml(city.id)}" aria-label="Make default">★</button>
        <button class="icon-action danger" type="button" data-remove-city="${escapeHtml(city.id)}" aria-label="Remove ${escapeHtml(city.name)}">✕</button>
      </div>
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
      relative_humidity_2m: pickArray(hourly, ["relative_humidity_2m", "relativehumidity_2m"]),
      wind_speed_10m: pickArray(hourly, ["wind_speed_10m", "windspeed_10m"]),
      wind_gusts_10m: pickArray(hourly, ["wind_gusts_10m", "windgusts_10m"]),
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
  const hourlyFields = [
    "temperature_2m",
    "apparent_temperature",
    "relative_humidity_2m",
    "uv_index",
    "weather_code",
    "wind_speed_10m",
    "wind_gusts_10m",
    "wind_direction_10m",
    "precipitation",
    "precipitation_probability",
    "is_day"
  ].join(",");

  const modernParams = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,is_day,weather_code",
    hourly: hourlyFields,
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
      hourly: "temperature_2m,relativehumidity_2m,apparent_temperature,windspeed_10m,winddirection_10m,windgusts_10m,uv_index,weathercode,precipitation",
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

async function fetchAirQuality(city) {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: "us_aqi,pm2_5,pm10",
    timezone: "auto"
  });

  const response = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Air quality unavailable.");
  const data = await response.json();
  const current = data?.current || {};
  return {
    usAqi: current.us_aqi,
    pm25: current.pm2_5,
    pm10: current.pm10,
    fetchedAt: Date.now(),
    failed: false
  };
}

async function refreshAirQuality(city) {
  if (!hasValidCoordinates(city)) return;
  if (city.air && !city.air.failed && Date.now() - (city.air.fetchedAt || 0) < AIR_STALE_AFTER_MS) return;

  let air;
  try {
    air = await fetchAirQuality(city);
  } catch {
    // Air quality is a bonus panel; a failure here must not disturb the forecast.
    air = { usAqi: null, pm25: null, pm10: null, fetchedAt: Date.now(), failed: true };
  }

  const target = state.cities.find((item) => item.id === city.id);
  if (!target) return;
  target.air = air;
  saveState();
  if (getActiveCity()?.id === city.id) renderAir(target);
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
    refreshAirQuality(resolvedCity);
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

function resetView() {
  viewDayIndex = 0;
  scrubIndex = null;
  scrubLocked = false;
}

async function addCity(city, makeDefault = false) {
  const normalized = normalizeCity(city);
  if (state.cities.some((entry) => entry.id === normalized.id)) {
    setStatus(`${normalized.name} is already saved.`);
    closeModal(els.searchModal);
    return;
  }

  resetView();
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

  resetView();
  setState((draft) => {
    draft.cities = draft.cities.filter((city) => city.id !== id);
    if (draft.defaultCityId === id) draft.defaultCityId = draft.cities[0]?.id || null;
    if (draft.activeCityId === id) draft.activeCityId = draft.defaultCityId || draft.cities[0]?.id || null;
  });
  renderManageList();
}

function setDefaultCity(id) {
  setState((draft) => {
    draft.defaultCityId = id;
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
  resetView();
  haptic(10);
  playSwipeTransition(direction);
  setState((draft) => {
    draft.activeCityId = draft.cities[nextIndex].id;
  });

  const next = getActiveCity();
  if (!next?.weather || Date.now() - (next.fetchedAt || 0) > STALE_AFTER_MS) refreshActiveWeather();
  else refreshAirQuality(next);
}

function toggleUnits() {
  haptic(10);
  resetView();
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

/* --------------------------------------------------------------- scrubbing */

function ribbonIndexFromClientX(clientX) {
  if (!currentFrame || !currentFrame.hours.length) return null;
  const rect = els.tempRibbon.getBoundingClientRect();
  if (!rect.width) return null;
  const ratio = (clientX - rect.left) / rect.width;
  const count = currentFrame.hours.length;
  return Math.min(count - 1, Math.max(0, Math.round(ratio * (count - 1))));
}

function applyScrub(index, { animate = false } = {}) {
  if (!currentFrame) return;
  scrubIndex = index;
  positionScrubMarker();
  renderHeroPanel(currentFrame, { animateTemp: animate });

  els.hourlyForecast.querySelectorAll("[data-hour]").forEach((card) => {
    card.classList.toggle("is-selected", Number(card.dataset.hour) === index);
  });
}

function clearScrub() {
  scrubIndex = null;
  scrubLocked = false;
  els.tempRibbon.classList.remove("is-scrubbing");
  if (currentFrame) {
    renderHeroPanel(currentFrame, { animateTemp: false });
    els.hourlyForecast.querySelectorAll("[data-hour]").forEach((card) => card.classList.remove("is-selected"));
  }
}

function bindScrub() {
  let scrubbing = false;

  els.tempRibbon.addEventListener("pointerdown", (event) => {
    const index = ribbonIndexFromClientX(event.clientX);
    if (index == null) return;
    scrubbing = true;
    scrubLocked = false;
    els.tempRibbon.setPointerCapture(event.pointerId);
    applyScrub(index);
  });

  els.tempRibbon.addEventListener("pointermove", (event) => {
    if (!scrubbing) return;
    const index = ribbonIndexFromClientX(event.clientX);
    if (index != null && index !== scrubIndex) applyScrub(index);
  });

  const release = () => {
    if (!scrubbing) return;
    scrubbing = false;
    // Dragging is a peek: let go and the hero returns to live conditions.
    if (!scrubLocked) clearScrub();
  };

  // Pointer capture guarantees up/cancel reach us, so no pointerleave handler is needed.
  els.tempRibbon.addEventListener("pointerup", release);
  els.tempRibbon.addEventListener("pointercancel", release);
}

/* ---------------------------------------------------------- reorder cities */

let dragSession = null;

function layoutDragShift() {
  if (!dragSession) return;
  const { items, item, index, target, step } = dragSession;
  items.forEach((element, position) => {
    if (element === item) return;
    let shift = 0;
    if (target > index && position > index && position <= target) shift = -step;
    else if (target < index && position >= target && position < index) shift = step;
    element.style.transform = `translateY(${shift}px)`;
  });
}

function endDrag() {
  if (!dragSession) return;
  const { items, item, index, target } = dragSession;
  items.forEach((element) => {
    element.style.transform = "";
    element.classList.remove("is-dragging", "is-shifting");
  });
  item.style.transform = "";
  dragSession = null;

  if (index !== target) {
    haptic(12);
    setState((draft) => {
      const [moved] = draft.cities.splice(index, 1);
      draft.cities.splice(target, 0, moved);
    });
  }
  renderManageList();
}

function bindReorder() {
  els.manageCityList.addEventListener("pointerdown", (event) => {
    const handle = event.target.closest("[data-drag-handle]");
    if (!handle) return;
    const item = handle.closest(".manage-item");
    const items = [...els.manageCityList.querySelectorAll(".manage-item")];
    const index = items.indexOf(item);
    if (index < 0 || items.length < 2) return;

    event.preventDefault();
    const first = items[0].getBoundingClientRect();
    const second = items[1].getBoundingClientRect();
    const step = Math.max(second.top - first.top, item.offsetHeight);

    dragSession = { item, items, index, target: index, startY: event.clientY, step };
    item.classList.add("is-dragging");
    items.forEach((element) => element !== item && element.classList.add("is-shifting"));
    handle.setPointerCapture(event.pointerId);
    haptic(10);
  });

  els.manageCityList.addEventListener("pointermove", (event) => {
    if (!dragSession) return;
    const delta = event.clientY - dragSession.startY;
    dragSession.item.style.transform = `translateY(${delta}px)`;

    const target = Math.min(
      dragSession.items.length - 1,
      Math.max(0, dragSession.index + Math.round(delta / dragSession.step))
    );
    if (target !== dragSession.target) {
      dragSession.target = target;
      layoutDragShift();
      haptic(6);
    }
  });

  els.manageCityList.addEventListener("pointerup", endDrag);
  els.manageCityList.addEventListener("pointercancel", endDrag);
}

/* ----------------------------------------------------------------- events */

function setPullProgress(distance) {
  const progress = Math.min(distance / PULL_DISTANCE, 1);
  els.pullIndicator.classList.toggle("is-visible", distance > 8);
  els.pullProgress.style.setProperty("--pull-offset", String(PULL_CIRCUMFERENCE * (1 - progress)));
  const armed = progress >= 1;
  if (armed !== pullArmed) {
    pullArmed = armed;
    if (armed) haptic(12);
  }
}

function endPull(triggered) {
  els.pullIndicator.classList.toggle("is-spinning", Boolean(triggered));
  if (!triggered) {
    els.pullIndicator.classList.remove("is-visible");
  } else {
    window.setTimeout(() => {
      els.pullIndicator.classList.remove("is-visible", "is-spinning");
    }, 1100);
  }
  pullDistance = 0;
  pullArmed = false;
}

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
      if (action === "manage-cities") {
        renderManageList();
        openModal(els.manageModal);
      }
      if (action === "share") {
        shareApp();
        return;
      }
      if (action === "about") openModal(els.aboutModal);
      return;
    }

    const closeButton = event.target.closest("[data-close-modal]");
    if (closeButton) {
      closeModal(document.getElementById(closeButton.dataset.closeModal));
      return;
    }

    const addCityButton = event.target.closest("[data-add-city]");
    if (addCityButton) {
      addCity(JSON.parse(addCityButton.dataset.addCity));
      return;
    }

    const removeCityButton = event.target.closest("[data-remove-city]");
    if (removeCityButton) {
      removeCity(removeCityButton.dataset.removeCity);
      return;
    }

    const defaultButton = event.target.closest("[data-make-default]");
    if (defaultButton) {
      setDefaultCity(defaultButton.dataset.makeDefault);
      renderManageList();
      return;
    }

    const alertChip = event.target.closest("[data-alert]");
    if (alertChip) {
      setStatus(alertChip.dataset.alert, 3600);
      haptic(8);
      return;
    }

    const metricTile = event.target.closest("[data-metric]");
    if (metricTile) {
      openMetric = openMetric === metricTile.dataset.metric ? null : metricTile.dataset.metric;
      haptic(8);
      if (currentFrame) renderMetricDetail(currentFrame);
      return;
    }

    const hourCard = event.target.closest("[data-hour]");
    if (hourCard) {
      const index = Number(hourCard.dataset.hour);
      haptic(8);
      if (scrubIndex === index && scrubLocked) {
        clearScrub();
      } else {
        scrubLocked = true;
        applyScrub(index, { animate: true });
      }
      return;
    }

    const dayCard = event.target.closest("[data-day]");
    if (dayCard) {
      const index = Number(dayCard.dataset.day);
      haptic(10);
      viewDayIndex = viewDayIndex === index ? 0 : index;
      scrubIndex = null;
      scrubLocked = false;
      displayedTemp = null;
      renderShell();
      return;
    }

    if (event.target.closest("#view-context")) {
      haptic(8);
      resetView();
      displayedTemp = null;
      renderShell();
      return;
    }

    // A tap on empty sky sends a gust through the canvas.
    if (!event.target.closest("button, input, .modal, .temp-ribbon, .list-item, .app-footer")) {
      triggerGust();
    }
  });

  els.modalBackdrop.addEventListener("click", closeAllModals);

  els.updateReloadBtn.addEventListener("click", () => window.location.reload());

  els.themeToggleBtn.addEventListener("click", () => {
    haptic(8);
    setState((draft) => {
      draft.theme = draft.theme === "dark" ? "light" : "dark";
    });
  });

  els.defaultStar.addEventListener("click", () => {
    const activeCity = getActiveCity();
    if (activeCity) {
      haptic(8);
      setDefaultCity(activeCity.id);
    }
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
    pullDistance = 0;
    pullArmed = false;
  }, { passive: true });

  els.citySwipeZone.addEventListener("touchmove", (event) => {
    if (document.querySelector(".modal:not(.hidden)")) return;
    const touch = event.changedTouches[0];
    const deltaY = touch.clientY - touchStartY;
    const deltaX = touch.clientX - touchStartX;

    if (els.screen.scrollTop <= 2 && deltaY > 0 && deltaY > Math.abs(deltaX) * 1.2) {
      pullDistance = deltaY;
      setPullProgress(deltaY);
    } else if (pullDistance) {
      pullDistance = 0;
      setPullProgress(0);
    }
  }, { passive: true });

  els.citySwipeZone.addEventListener("touchend", (event) => {
    if (document.querySelector(".modal:not(.hidden)")) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    const elapsed = Date.now() - touchStartTime;

    if (pullArmed && elapsed < 2000) {
      endPull(true);
      setStatus("Refreshing weather...", 1200);
      refreshActiveWeather();
      return;
    }
    endPull(false);

    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
    swipeCity(deltaX < 0 ? "left" : "right");
  }, { passive: true });

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    // Ribbon, sparkline and sun arc are drawn in pixel units, so rebuild them on rotation.
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
bindScrub();
bindReorder();
renderSearchResults();
renderShell();
registerServiceWorker();
setupInitialCity();
