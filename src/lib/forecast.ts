const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const MAX_FORECAST_DAYS = 16;

export interface ForecastDay {
  date: string;
  highC: number | null;
  lowC: number | null;
  precipChance: number | null;
  condition: string;
}

export interface ForecastHit {
  ok: true;
  source: "open-meteo";
  place: string;
  country?: string;
  days: ForecastDay[];
}

export interface ForecastMiss {
  ok: false;
  reason: string;
  place?: string;
}

export type ForecastResult = ForecastHit | ForecastMiss;

interface GeocodeResult {
  results?: Array<{
    name: string;
    country?: string;
    latitude: number;
    longitude: number;
  }>;
}

interface DailyForecast {
  time?: string[];
  weather_code?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_probability_max?: number[];
}

function isoDate(value: string): string | null {
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return null;
  const date = new Date(`${match[1]}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return match[1];
}

function utcDay(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function daysFromToday(iso: string): number {
  const today = new Date();
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((utcDay(iso).getTime() - start) / 86_400_000);
}

function describeWeatherCode(code: number | undefined): string {
  if (code === undefined || Number.isNaN(code)) return "conditions unavailable";
  if (code === 0) return "clear";
  if (code <= 3) return "partly cloudy";
  if (code <= 48) return "fog";
  if (code <= 57) return "drizzle";
  if (code <= 67) return "rain";
  if (code <= 77) return "snow";
  if (code <= 82) return "rain showers";
  if (code <= 86) return "snow showers";
  return "thunderstorms";
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function lookupForecast(
  destination: string,
  date: string,
  endDate?: string,
): Promise<ForecastResult> {
  const start = isoDate(date);
  if (!start) {
    return {
      ok: false,
      reason: "Need a concrete date (YYYY-MM-DD) to look up a live forecast.",
    };
  }

  const end = endDate ? isoDate(endDate) ?? start : start;
  const rangeStart = start <= end ? start : end;
  const rangeEnd = start <= end ? end : start;
  const startOffset = daysFromToday(rangeStart);
  const endOffset = daysFromToday(rangeEnd);

  if (endOffset < 0) {
    return {
      ok: false,
      reason: "That date is in the past, so there is no upcoming forecast to fetch.",
    };
  }

  if (startOffset > MAX_FORECAST_DAYS) {
    return {
      ok: false,
      reason: `No reliable live forecast beyond about ${MAX_FORECAST_DAYS} days. Use seasonal norms and say so.`,
    };
  }

  const clippedEndOffset = Math.min(endOffset, MAX_FORECAST_DAYS);
  const today = new Date();
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const clippedEndIso = new Date(todayUtc + clippedEndOffset * 86_400_000)
    .toISOString()
    .slice(0, 10);

  try {
    const geo = await fetchJson<GeocodeResult>(
      `${GEOCODE_URL}?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`,
    );
    const place = geo.results?.[0];
    if (!place) {
      return {
        ok: false,
        reason: `Could not find coordinates for "${destination}". Use seasonal norms and say the live lookup missed.`,
      };
    }

    const forecastStart = startOffset < 0 ? new Date().toISOString().slice(0, 10) : rangeStart;
    const params = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_probability_max",
      ].join(","),
      start_date: forecastStart,
      end_date: clippedEndIso,
      timezone: "auto",
    });

    const forecast = await fetchJson<{ daily?: DailyForecast }>(
      `${FORECAST_URL}?${params.toString()}`,
    );
    const daily = forecast.daily;
    if (!daily?.time?.length) {
      return {
        ok: false,
        place: place.name,
        reason:
          "The forecast service returned no daily data. Use seasonal norms and say the live lookup missed.",
      };
    }

    const days: ForecastDay[] = daily.time.map((day, index) => ({
      date: day,
      highC: daily.temperature_2m_max?.[index] ?? null,
      lowC: daily.temperature_2m_min?.[index] ?? null,
      precipChance: daily.precipitation_probability_max?.[index] ?? null,
      condition: describeWeatherCode(daily.weather_code?.[index]),
    }));

    return {
      ok: true,
      source: "open-meteo",
      place: place.name,
      country: place.country,
      days,
    };
  } catch {
    return {
      ok: false,
      reason:
        "The live forecast lookup failed. Be upfront, then use seasonal norms labelled as such.",
    };
  }
}
