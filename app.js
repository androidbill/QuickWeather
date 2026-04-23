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
  feelsLike: document.getElementById("feels-like"),
  windSpeed: document.getElementById("wind-speed"),
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
  return `${Math.round(value)}${tempUnitSymbol()}`;
}

function formatWind(value) {
  return `${Math.round(value)} km/h`;
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
  els.themeColorMeta.setAttribute("content", state.theme === "dark" ? "#142033" : "#eef4fb");

  const activeCity = getActiveCity();
  els.cityName.textContent = activeCity ? activeCity.name : "Loading...";
  els.defaultStar.classList.toggle("is-default", Boolean(activeCity && activeCity.id === state.defaultCityId));

  if (!activeCity?.weather) {
    els.currentIcon.innerHTML = weatherIconSvg(2, true);
    els.currentTemp.textContent = "--°";
    els.currentCondition.textContent = activeCity ? "Loading weather..." : "Finding your city...";
    els.feelsLike.textContent = "--";
    els.windSpeed.textContent = "--";
    els.humidity.textContent = "--";
    els.uvIndex.textContent = "--";
    els.sunrise.textContent = "--";
    els.sunset.textContent = "--";
    els.hourlyForecast.innerHTML = "";
    els.dailyForecast.innerHTML = "";
    return;
  }

  const weather = activeCity.weather;
  const current = weather.current;
  const timezone = weather.timezone;
  const todayIndex = 0;

  els.currentIcon.innerHTML = weatherIconSvg(current.weather_code, Boolean(current.is_day));
  els.currentTemp.textContent = formatTemperature(current.temperature_2m);
  els.currentCondition.textContent = weatherLabel(current.weather_code);
  els.feelsLike.textContent = formatTemperature(current.apparent_temperature);
  els.windSpeed.textContent = formatWind(current.wind_speed_10m);
  els.humidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
  els.uvIndex.textContent = Number(current.uv_index || 0).toFixed(2).replace(/\.00$/, "");
  els.sunrise.textContent = formatTime(weather.daily.sunrise[todayIndex], timezone);
  els.sunset.textContent = formatTime(weather.daily.sunset[todayIndex], timezone);

  const currentHourIndex = weather.hourly.time.findIndex((time) => time === current.time);
  const startIndex = currentHourIndex >= 0 ? currentHourIndex : 0;
  const hourlySlice = weather.hourly.time.slice(startIndex, startIndex + 24).map((time, index) => ({
    time,
    temperature: weather.hourly.temperature_2m[startIndex + index],
    wind: weather.hourly.wind_speed_10m[startIndex + index],
    code: weather.hourly.weather_code[startIndex + index]
  }));

  els.hourlyForecast.innerHTML = hourlySlice.map((hour, index) => `
    <article class="forecast-card">
      <div class="forecast-label">${formatHourLabel(hour.time, timezone, index === 0)}</div>
      <div class="forecast-icon">${weatherIconSvg(hour.code, true)}</div>
      <div class="forecast-temp">${formatTemperature(hour.temperature)}</div>
      <div class="forecast-sub">⇆ ${formatWind(hour.wind)}</div>
    </article>
  `).join("");

  els.dailyForecast.innerHTML = weather.daily.time.slice(0, 14).map((date, index) => `
    <article class="forecast-card daily-card">
      <div class="forecast-label">${formatDay(date, timezone)}</div>
      <div class="forecast-icon">${weatherIconSvg(weather.daily.weather_code[index], true)}</div>
      <div class="forecast-temp">${formatTemperature(weather.daily.temperature_2m_max[index])}</div>
      <div class="forecast-range">${formatTemperature(weather.daily.temperature_2m_min[index])}</div>
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
  const sun = `<circle cx="10" cy="10" r="4.4"></circle><path d="M10 1.5v3.2M10 15.3v3.2M1.5 10h3.2M15.3 10h3.2M3.7 3.7l2.3 2.3M14 14l2.3 2.3M16.3 3.7L14 6M6 14l-2.3 2.3"></path>`;
  const moon = `<path d="M13.8 4.2a7.8 7.8 0 1 0 6.5 13.1A8.8 8.8 0 0 1 13.8 4.2Z"></path>`;
  const cloud = `<path d="M7.5 19.5H19a4.9 4.9 0 0 0 .3-9.8 6.1 6.1 0 0 0-11.6 1.8 4 4 0 0 0-.2 8Z"></path>`;
  const rain = `${cloud}<path d="M10 23l-1.5 3M16 23l-1.5 3M22 23l-1.5 3"></path>`;
  const snow = `${cloud}<path d="M11 23h0M15 26h0M19 23h0"></path><path d="M11 21v4M9 23h4M15 24v4M13 26h4M19 21v4M17 23h4"></path>`;
  const storm = `${cloud}<path d="M14 21l-2 5h3l-1 4 5-7h-3l1-2z"></path>`;
  const partlyCloudyDay = `<g transform="translate(1 0)">${sun}</g><g transform="translate(4 4)">${cloud}</g>`;
  const partlyCloudyNight = `<g transform="translate(1 1)">${moon}</g><g transform="translate(4 4)">${cloud}</g>`;

  let content = cloud;
  if (code === 0) content = isDay ? sun : moon;
  else if ([1, 2].includes(code)) content = isDay ? partlyCloudyDay : partlyCloudyNight;
  else if (code === 3) content = cloud;
  else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) content = rain;
  else if ([71, 73, 75, 77, 85, 86].includes(code)) content = snow;
  else if ([95, 96, 99].includes(code)) content = storm;

  return `<svg viewBox="0 0 26 30" aria-hidden="true">${content}</svg>`;
}

async function fetchWeatherForCity(city) {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,uv_index,is_day,weather_code",
    hourly: "temperature_2m,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset",
    temperature_unit: state.units,
    wind_speed_unit: "kmh",
    timezone: "auto",
    forecast_days: "14"
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) throw new Error("Unable to load weather right now.");
  return response.json();
}

async function refreshActiveWeather() {
  const city = getActiveCity();
  if (!city) return;

  try {
    const weather = await fetchWeatherForCity(city);
    setState((draft) => {
      const target = draft.cities.find((item) => item.id === city.id);
      if (target) target.weather = weather;
    });
  } catch (error) {
    setStatus(error.message || "Weather update failed.");
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

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`);
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
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
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

  window.location.href = `./index.html?refresh=${Date.now()}`;
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).catch(() => {});
  }
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
    }
  }, { passive: true });

  els.citySwipeZone.addEventListener("touchend", (event) => {
    if (document.querySelector(".modal:not(.hidden)")) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
    swipeCity(deltaX < 0 ? "left" : "right");
  }, { passive: true });
}

bindEvents();
renderSearchResults();
renderShell();
setupInitialCity();
registerServiceWorker();
