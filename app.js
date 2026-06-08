const STORAGE_KEY = "quickweather_v1_1";
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

const els = {
  body: document.body,
  themeColorMeta: document.getElementById("theme-color-meta"),
  cityName: document.getElementById("city-name"),
  defaultStar: document.getElementById("default-star"),
  themeToggleBtn: document.getElementById("theme-toggle-btn"),
  menuBtn: document.getElementById("menu-btn"),
  menuPanel: document.getElementById("menu-panel"),
  unitsMenuBtn: document.getElementById("units-menu-btn"),
  currentIcon: document.getElementById("current-icon"),
  currentTemp: document.getElementById("current-temp"),
  currentCondition: document.getElementById("current-condition"),
  currentSummary: document.getElementById("current-summary"),
  feelsLike: document.getElementById("feels-like"),
  windSpeed: document.getElementById("wind-speed"),
  windDirection: document.getElementById("wind-direction"),
  windGust: document.getElementById("wind-gust"),
  windCompassNeedle: document.getElementById("wind-compass-needle"),
  humidity: document.getElementById("humidity"),
  uvIndex: document.getElementById("uv-index"),
  sunrise: document.getElementById("sunrise"),
  sunset: document.getElementById("sunset"),
  hourlyForecast: document.getElementById("hourly-forecast"),
  dailyForecast: document.getElementById("daily-forecast"),
  statusBanner: document.getElementById("status-banner"),
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

let state = loadState();
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
    weather: city.weather || null
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

function setStatus(message, delay = 2200) {
  els.statusBanner.textContent = message;
  els.statusBanner.classList.remove("hidden");
  window.clearTimeout(setStatus.timer);
  setStatus.timer = window.setTimeout(() => els.statusBanner.classList.add("hidden"), delay);
}

function weatherLabel(code) {
  return WEATHER_CODE_LABELS[code] || "Weather";
}

function tempUnitSymbol() {
  return state.units === "celsius" ? "°" : "°";
}

function formatTemperature(value) {
  if (value == null || Number.isNaN(Number(value))) return "--";
  return `${Math.round(value)}${tempUnitSymbol()}`;
}

function formatWind(value) {
  if (value == null || Number.isNaN(Number(value))) return "--";
  return `${Math.round(value)} km/h`;
}

function formatGust(value) {
  if (value == null || Number.isNaN(Number(value))) return "Gust --";
  return `Gust ${Math.round(value)} km/h`;
}

function formatDistanceMeters(value) {
  if (value == null || Number.isNaN(Number(value))) return "--";
  const km = Number(value) / 1000;
  return `${km.toFixed(km >= 10 ? 0 : 1)} km`;
}

function formatPressure(value) {
  if (value == null || Number.isNaN(Number(value))) return "--";
  return `${Math.round(value)} hPa`;
}

function formatPrecipitation(value) {
  if (value == null || Number.isNaN(Number(value))) return "--";
  return `${Number(value).toFixed(value >= 10 ? 0 : 1)} mm`;
}

function formatTime(iso, timezone) {
  const timePart = String(iso).split("T")[1] || "";
  const [hourText = "0", minute = "00"] = timePart.split(":");
  const hour = Number(hourText);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${suffix}`;
}

function formatDay(iso, timezone) {
  const [year, month, day] = iso.split("-").map(Number);
  const stableDate = new Date(Date.UTC(year, month - 1, day, 12));
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(stableDate);
}

function formatHourLabel(iso, timezone, isFirst) {
  if (isFirst) return "Now";
  const timePart = String(iso).split("T")[1] || "";
  const [hourText = "0"] = timePart.split(":");
  const hour = Number(hourText);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}${suffix}`;
}

function formatUpdatedTime(iso) {
  const timePart = String(iso).split("T")[1] || "";
  const [hourText = "0", minute = "00"] = timePart.split(":");
  const hour = Number(hourText);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${suffix}`;
}

function compassDirection(degrees) {
  if (degrees == null || Number.isNaN(Number(degrees))) return "--";
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(Number(degrees) / 45) % 8];
}

function windArrow(degrees) {
  if (degrees == null || Number.isNaN(Number(degrees))) return "↑";
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
  const hourlyTime = pickArray(weather?.hourly, ["time"]);
  const dailyTime = pickArray(weather?.daily, ["time"]);
  return hourlyTime.length > 0 && dailyTime.length > 0;
}

function skyMode(code, isDay) {
  if (!isDay) return "night";
  if ([95, 96, 99].includes(code)) return "storm";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([1, 2, 3, 45, 48].includes(code)) return "cloud";
  return "clear";
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

function buildHeroSummary(current, daily) {
  const bits = [];
  if (current.wind_speed_10m != null) {
    bits.push(`${compassDirection(current.wind_direction_10m)} wind at ${formatWind(current.wind_speed_10m)}`);
  }
  if (current.wind_gusts_10m != null) bits.push(`gusts ${formatWind(current.wind_gusts_10m)}`);
  if (current.relative_humidity_2m != null) bits.push(`${Math.round(current?.relative_humidity_2m ?? 0)}% humidity`);
  if (daily.precipitation_probability_max?.[0] != null) {
    bits.push(`${Math.round(daily.precipitation_probability_max[0])}% chance of precipitation`);
  }
  return bits.join(" • ");
}

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
      weather_code: currentWeather.weathercode,
      precipitation: pickArray(hourly, ["precipitation"])[safeIndex],
      cloud_cover: pickArray(hourly, ["cloudcover", "cloud_cover"])[safeIndex],
      visibility: pickArray(hourly, ["visibility"])[safeIndex],
      surface_pressure: pickArray(hourly, ["surface_pressure"])[safeIndex]
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

function openModal(modal) {
  els.modalBackdrop.classList.remove("hidden");
  modal.classList.remove("hidden");
  closeMenu();
}

function closeModal(modal) {
  modal.classList.add("hidden");
  const anyOpen = [els.searchModal, els.removeModal, els.aboutModal].some((node) => !node.classList.contains("hidden"));
  if (!anyOpen) els.modalBackdrop.classList.add("hidden");
}

function closeAllModals() {
  [els.searchModal, els.removeModal, els.aboutModal].forEach((modal) => modal.classList.add("hidden"));
  els.modalBackdrop.classList.add("hidden");
}

function openMenu() {
  els.menuPanel.classList.toggle("hidden");
}

function closeMenu() {
  els.menuPanel.classList.add("hidden");
}

function renderShell() {
  els.body.dataset.theme = state.theme;
  els.themeToggleBtn.textContent = themeIcon(state.theme);
  els.unitsMenuBtn.textContent = unitLabel();

  const activeCity = getActiveCity();
  const activeError = activeCity ? weatherErrors.get(activeCity.id) : "";
  els.cityName.textContent = activeCity ? activeCity.name : "Loading...";
  els.defaultStar.classList.toggle("is-default", Boolean(activeCity && activeCity.id === state.defaultCityId));

  if (!activeCity?.weather) {
    els.body.dataset.sky = "cloud";
    els.themeColorMeta.setAttribute("content", themeChromeColor(state.theme, "cloud"));
    els.currentIcon.innerHTML = weatherIconSvg(2, true);
    els.currentTemp.textContent = "--°";
    els.currentCondition.textContent = activeCity ? (activeError || "Loading weather...") : "Finding your city...";
    els.currentSummary.textContent = "Preparing wind profile...";
    els.feelsLike.textContent = "--";
    els.windSpeed.textContent = "--";
    els.windDirection.textContent = "--";
    els.windGust.textContent = "Gust --";
    els.windCompassNeedle.style.setProperty("--wind-rotation", "0deg");
    els.humidity.textContent = "--";
    els.uvIndex.textContent = "--";
    els.sunrise.textContent = "--";
    els.sunset.textContent = "--";
    els.hourlyForecast.innerHTML = "";
    els.dailyForecast.innerHTML = "";

    if (activeCity && !activeError && !pendingWeatherRefresh.has(activeCity.id) && !renderShell.refreshQueued) {
      renderShell.refreshQueued = true;
      queueMicrotask(async () => {
        try {
          await refreshActiveWeather();
        } finally {
          renderShell.refreshQueued = false;
        }
      });
    }
    return;
  }

  if (!hasRenderableForecast(activeCity.weather)) {
    els.body.dataset.sky = "cloud";
    els.themeColorMeta.setAttribute("content", themeChromeColor(state.theme, "cloud"));
    els.currentIcon.innerHTML = weatherIconSvg(2, true);
    els.currentTemp.textContent = "--°";
    els.currentCondition.textContent = "Updating forecast...";
    els.currentSummary.textContent = "Refreshing wind profile...";
    els.feelsLike.textContent = "--";
    els.windSpeed.textContent = "--";
    els.windDirection.textContent = "--";
    els.windGust.textContent = "Gust --";
    els.windCompassNeedle.style.setProperty("--wind-rotation", "0deg");
    els.humidity.textContent = "--";
    els.uvIndex.textContent = "--";
    els.sunrise.textContent = "--";
    els.sunset.textContent = "--";
    els.hourlyForecast.innerHTML = "";
    els.dailyForecast.innerHTML = "";

    if (!renderShell.refreshQueued) {
      renderShell.refreshQueued = true;
      queueMicrotask(async () => {
        try {
          await refreshActiveWeather();
        } finally {
          renderShell.refreshQueued = false;
        }
      });
    }
    return;
  }

  const weather = activeCity.weather;
  const current = weather.current;
  const timezone = weather.timezone;
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
  const precipitationChance = dailyPrecipMax[todayIndex];
  const currentSky = skyMode(current.weather_code, Boolean(current.is_day));

  els.body.dataset.sky = currentSky;
  els.themeColorMeta.setAttribute("content", themeChromeColor(state.theme, currentSky));

  els.currentIcon.innerHTML = weatherIconSvg(current.weather_code, Boolean(current.is_day));
  els.currentTemp.textContent = formatTemperature(current.temperature_2m);
  els.currentCondition.textContent = weatherLabel(current.weather_code);
  els.currentSummary.textContent = buildHeroSummary(current, weather.daily);
  els.feelsLike.textContent = formatTemperature(current.apparent_temperature);
  els.windSpeed.textContent = formatWind(current.wind_speed_10m);
  els.windDirection.textContent = `${compassDirection(current.wind_direction_10m)} ${current.wind_direction_10m != null ? `${Math.round(current.wind_direction_10m)}°` : ""}`.trim();
  els.windGust.textContent = formatGust(current.wind_gusts_10m);
  els.windCompassNeedle.style.setProperty("--wind-rotation", `${Number(current.wind_direction_10m || 0)}deg`);
  els.humidity.textContent = `${Math.round(current?.relative_humidity_2m ?? 0)}%`;
  els.uvIndex.textContent = Number(current.uv_index || 0).toFixed(2).replace(/\.00$/, "");
  els.sunrise.textContent = formatTime(dailySunrise[todayIndex], timezone);
  els.sunset.textContent = formatTime(dailySunset[todayIndex], timezone);

  const currentHourIndex = hourlyTime.findIndex((time) => time === current.time);
  const startIndex = currentHourIndex >= 0 ? currentHourIndex : 0;
  const hourlySlice = hourlyTime.slice(startIndex, startIndex + 24).map((time, index) => ({
    time,
    temperature: hourlyTemps[startIndex + index],
    wind: hourlyWinds[startIndex + index],
    windDirection: hourlyWindDirections[startIndex + index],
    code: hourlyCodes[startIndex + index],
    precipitationProbability: hourlyPrecip[startIndex + index]
  }));

  els.hourlyForecast.innerHTML = hourlySlice.map((hour, index) => `
    <article class="forecast-card">
      <div class="forecast-label">${formatHourLabel(hour.time, timezone, index === 0)}</div>
      <div class="forecast-icon">${weatherIconSvg(hour.code, true)}</div>
      <div class="forecast-temp">${formatTemperature(hour.temperature)}</div>
      <div class="forecast-sub">${windArrow(hour.windDirection)} ${formatWind(hour.wind)}</div>
      <div class="forecast-direction">${compassDirection(hour.windDirection)}</div>
      <div class="forecast-note">${hour.precipitationProbability != null ? `${Math.round(hour.precipitationProbability)}% precip` : ""}</div>
    </article>
  `).join("");

  els.dailyForecast.innerHTML = dailyTime.slice(0, 14).map((date, index) => `
    <article class="forecast-card daily-card">
      <div class="forecast-label">${formatDay(date, timezone)}</div>
      <div class="forecast-icon">${weatherIconSvg(dailyCodes[index], true)}</div>
      <div class="forecast-range"><span class="range-high">${formatTemperature(dailyHighs[index])}</span> <span class="range-low">${formatTemperature(dailyLows[index])}</span></div>
      <div class="forecast-note">${dailyPrecipMax[index] != null ? `${Math.round(dailyPrecipMax[index])}% precip` : ""}</div>
    </article>
  `).join("");
}

function renderSearchResults(results = [], message = "Search for a city to add.") {
  if (!results.length) {
    els.searchResults.innerHTML = `<div class="list-item"><div><strong>${message}</strong><span>QuickWeather will save the city after you add it.</span></div></div>`;
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

async function fetchWeatherForCity(city) {
  const modernParams = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,is_day,weather_code,precipitation,cloud_cover,visibility,surface_pressure",
    hourly: "temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation_probability",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max",
    temperature_unit: state.units,
    wind_speed_unit: "kmh",
    timezone: "auto",
    forecast_days: "14"
  });

  try {
    const modernResponse = await fetch(`https://api.open-meteo.com/v1/forecast?${modernParams.toString()}`, { cache: "no-store" });
    if (!modernResponse.ok) throw new Error("modern fetch failed");
    const modernData = await modernResponse.json();
    return normalizeWeatherResponse(modernData);
  } catch {
    const legacyParams = new URLSearchParams({
      latitude: String(city.latitude),
      longitude: String(city.longitude),
      current_weather: "true",
      daily: "weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset",
      hourly: "temperature_2m,relativehumidity_2m,apparent_temperature,windspeed_10m,winddirection_10m,uv_index,weathercode",
      temperature_unit: state.units,
      windspeed_unit: "kmh",
      timezone: "auto",
      forecast_days: "14"
    });

    const legacyResponse = await fetch(`https://api.open-meteo.com/v1/forecast?${legacyParams.toString()}`, { cache: "no-store" });
    if (!legacyResponse.ok) throw new Error("Unable to load weather right now.");
    const legacyData = await legacyResponse.json();
    return normalizeWeatherResponse(legacyData);
  }
}

async function refreshActiveWeather() {
  const city = getActiveCity();
  if (!city) return;

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

      resolvedCity = getActiveCity() || {
        ...resolvedCity,
        latitude: fallbackMatch.latitude,
        longitude: fallbackMatch.longitude,
        admin1: fallbackMatch.admin1 || resolvedCity.admin1,
        country: fallbackMatch.country || resolvedCity.country,
        timezone: fallbackMatch.timezone || resolvedCity.timezone
      };
    }

    const weather = await fetchWeatherForCity(resolvedCity);
    setState((draft) => {
      const target = draft.cities.find((item) => item.id === city.id);
      if (target) target.weather = weather;
    });
  } catch (error) {
    weatherErrors.set(city.id, error.message || "Weather update failed.");
    setStatus(error.message || "Weather update failed.");
    renderShell();
  } finally {
    pendingWeatherRefresh.delete(city.id);
  }
}

async function addCity(city, makeDefault = false) {
  const normalized = normalizeCity(city);
  const exists = state.cities.some((entry) => entry.id === normalized.id);
  if (exists) {
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

function swipeCity(direction) {
  if (state.cities.length < 2) return;
  const index = state.cities.findIndex((city) => city.id === state.activeCityId);
  const nextIndex = direction === "left"
    ? (index + 1) % state.cities.length
    : (index - 1 + state.cities.length) % state.cities.length;

  setState((draft) => {
    draft.activeCityId = draft.cities[nextIndex].id;
  });

  if (!getActiveCity()?.weather) refreshActiveWeather();
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

async function forceRefreshPage() {
  closeMenu();
  closeAllModals();
  setStatus("Refreshing app...", 1200);

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
    // Ignore refresh cleanup failures and still reload.
  }

  window.location.replace(`./index.html?refresh=${Date.now()}`);
}

async function disableRuntimeCaching() {
  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    } catch {
      // Ignore cleanup failures.
    }
  }
  if ("caches" in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    } catch {
      // Ignore cleanup failures.
    }
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js");
      registration.update();
    } catch {
      // The app still works online when service worker registration is unavailable.
    }
  });
}

function bindEvents() {
  els.menuBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    openMenu();
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
      if (action === "refresh-page") {
        forceRefreshPage();
        return;
      }
      if (action === "toggle-units") {
        setState((draft) => {
          draft.units = draft.units === "celsius" ? "fahrenheit" : "celsius";
        });
        refreshActiveWeather();
      }
      if (action === "remove-city") {
        renderRemoveList();
        openModal(els.removeModal);
      }
      if (action === "about") openModal(els.aboutModal);
    }

    const closeButton = event.target.closest("[data-close-modal]");
    if (closeButton) {
      closeModal(document.getElementById(closeButton.dataset.closeModal));
    }

    const addCityButton = event.target.closest("[data-add-city]");
    if (addCityButton) {
      addCity(JSON.parse(addCityButton.dataset.addCity));
    }

    const removeCityButton = event.target.closest("[data-remove-city]");
    if (removeCityButton) {
      removeCity(removeCityButton.dataset.removeCity);
    }
  });

  els.modalBackdrop.addEventListener("click", closeAllModals);

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
    if (!document.querySelector(".modal:not(.hidden)")) {
      const touch = event.changedTouches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
    }
  }, { passive: true });

  els.citySwipeZone.addEventListener("touchend", (event) => {
    if (document.querySelector(".modal:not(.hidden)")) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    const elapsed = Date.now() - touchStartTime;
    if (deltaY > 70 && deltaY > Math.abs(deltaX) * 1.2 && elapsed < 900) {
      forceRefreshPage();
      return;
    }
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
    swipeCity(deltaX < 0 ? "left" : "right");
  }, { passive: true });
}

bindEvents();
renderSearchResults();
renderShell();
registerServiceWorker();
setupInitialCity();
