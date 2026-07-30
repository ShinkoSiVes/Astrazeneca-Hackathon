export type ScreeningLocation = {
  region: string;
  municipality: string;
  barangay: string;
};

export type EnvironmentalRiskSnapshot = {
  location: ScreeningLocation;
  geocodedName: string;
  latitude: number;
  longitude: number;
  fetchedAt: string;
  pm25: number | null;
  pm10: number | null;
  nitrogenDioxide: number | null;
  usAqi: number | null;
  whoGuidelineRatio: number | null;
  exposureTier: "Lower" | "Moderate" | "Higher" | "Unknown";
  lungCancerRiskFactors: string[];
  dataLevel: "city";
  source: string;
  sourceUrl: string;
};

type GeocodingResult = {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  population?: number;
  feature_code?: string;
};

type GeocodingResponse = {
  results?: GeocodingResult[];
};

type AirQualityResponse = {
  latitude: number;
  longitude: number;
  current?: {
    pm2_5?: number;
    pm10?: number;
    nitrogen_dioxide?: number;
    us_aqi?: number;
  };
};

export const environmentalRiskCacheKey = "aeris-environmental-risk-cache-v1";
export const WHO_PM25_GUIDELINE = 5;

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const SOURCE_LABEL = "Open-Meteo Air Quality API (Copernicus CAMS)";
const SOURCE_URL = "https://open-meteo.com/en/docs/air-quality-api";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const normaliseToken = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

export const parseMunicipalityLabel = (municipality: string) => {
  const [name = municipality, province = ""] = municipality.split(" — ").map((part) => part.trim());
  return { name, province };
};

export const regionSearchHints = (region: string) => {
  const hints = new Set<string>();
  const cleaned = region.replace(/\([^)]*\)/g, " ");
  cleaned.split(/[—,-]/).map((part) => part.trim()).filter(Boolean).forEach((part) => {
    const token = normaliseToken(part);
    if (token.length > 3) hints.add(token);
  });

  if (region.includes("NCR")) hints.add(normaliseToken("National Capital Region"));
  if (region.includes("CALABARZON")) hints.add(normaliseToken("Calabarzon"));
  if (region.includes("MIMAROPA")) hints.add(normaliseToken("Mimaropa"));
  if (region.includes("BARMM")) hints.add(normaliseToken("Autonomous Region in Muslim Mindanao"));

  return [...hints];
};

const scoreGeocodingResult = (result: GeocodingResult, region: string, province: string) => {
  let score = 0;
  const regionHints = regionSearchHints(region);
  const provinceToken = normaliseToken(province);

  if (result.feature_code?.startsWith("PPL")) score += 2;
  if (typeof result.population === "number") score += Math.min(result.population / 100_000, 4);

  for (const hint of regionHints) {
    if (normaliseToken(result.admin1 ?? "").includes(hint) || hint.includes(normaliseToken(result.admin1 ?? ""))) score += 12;
    if (normaliseToken(result.admin2 ?? "").includes(hint) || hint.includes(normaliseToken(result.admin2 ?? ""))) score += 8;
  }

  if (provinceToken) {
    if (normaliseToken(result.admin2 ?? "").includes(provinceToken)) score += 10;
    if (normaliseToken(result.admin3 ?? "").includes(provinceToken)) score += 6;
  }

  return score;
};

export const pickGeocodingResult = (results: GeocodingResult[], region: string, province: string) => {
  if (!results.length) return null;
  return [...results].sort((left, right) => scoreGeocodingResult(right, region, province) - scoreGeocodingResult(left, region, province))[0];
};

export const geocodingSearchName = (municipalityName: string) => municipalityName.replace(/^city of\s+/i, "").trim() || municipalityName;

export const locationStorageKey = (location: ScreeningLocation) => [
  normaliseToken(location.region),
  normaliseToken(location.municipality),
  normaliseToken(location.barangay),
].join("|");

export const exposureTierForPm25 = (pm25: number | null): EnvironmentalRiskSnapshot["exposureTier"] => {
  if (pm25 === null || Number.isNaN(pm25)) return "Unknown";
  if (pm25 >= 15) return "Higher";
  if (pm25 >= 10) return "Moderate";
  return "Lower";
};

export const lungCancerRiskFactorsFromReadings = (pm25: number | null, pm10: number | null, nitrogenDioxide: number | null) => {
  const factors: string[] = [];

  if (pm25 !== null) {
    if (pm25 >= 15) factors.push("Elevated PM2.5 — fine particulate matter linked to lung cancer from chronic air pollution exposure.");
    else if (pm25 >= 10) factors.push("Moderate PM2.5 — above WHO annual guideline (5 μg/m³) for fine particulate matter.");
    else if (pm25 > WHO_PM25_GUIDELINE) factors.push("PM2.5 above WHO annual guideline (5 μg/m³).");
  }

  if (pm10 !== null && pm10 >= 20) {
    factors.push("Elevated PM10 — coarse particulate matter from urban air pollution.");
  }

  if (nitrogenDioxide !== null && nitrogenDioxide >= 25) {
    factors.push("Elevated nitrogen dioxide — marker of traffic-related outdoor air pollution.");
  }

  if (!factors.length) {
    factors.push("Current air-quality reading shows no elevated lung-cancer-relevant pollutant levels.");
  }

  return factors;
};

const readCache = (): Record<string, EnvironmentalRiskSnapshot> => {
  try {
    const parsed = JSON.parse(localStorage.getItem(environmentalRiskCacheKey) ?? "{}") as Record<string, EnvironmentalRiskSnapshot>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const readCachedEnvironmentalRisk = (location: ScreeningLocation) => {
  const cached = readCache()[locationStorageKey(location)];
  if (!cached) return null;
  const ageMs = Date.now() - Date.parse(cached.fetchedAt);
  return ageMs <= CACHE_TTL_MS ? cached : null;
};

export const cacheEnvironmentalRisk = (snapshot: EnvironmentalRiskSnapshot) => {
  const cache = readCache();
  cache[locationStorageKey(snapshot.location)] = snapshot;
  localStorage.setItem(environmentalRiskCacheKey, JSON.stringify(cache));
};

export const fetchGeocodingResult = async (location: ScreeningLocation, fetchImpl: typeof fetch = fetch) => {
  const { name, province } = parseMunicipalityLabel(location.municipality);
  const query = geocodingSearchName(name);
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&country=PH&count=8&language=en`;
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`Geocoding request failed (${response.status})`);

  const payload = await response.json() as GeocodingResponse;
  const match = pickGeocodingResult(payload.results ?? [], location.region, province);
  if (!match) throw new Error(`No geocoding match for ${query}`);
  return match;
};

export const fetchAirQualityReading = async (latitude: number, longitude: number, fetchImpl: typeof fetch = fetch) => {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "pm2_5,pm10,us_aqi,nitrogen_dioxide",
    timezone: "Asia/Manila",
  });
  const response = await fetchImpl(`${AIR_QUALITY_URL}?${params}`);
  if (!response.ok) throw new Error(`Air quality request failed (${response.status})`);

  const payload = await response.json() as AirQualityResponse;
  return {
    latitude: payload.latitude,
    longitude: payload.longitude,
    pm25: payload.current?.pm2_5 ?? null,
    pm10: payload.current?.pm10 ?? null,
    nitrogenDioxide: payload.current?.nitrogen_dioxide ?? null,
    usAqi: payload.current?.us_aqi ?? null,
  };
};

export const buildEnvironmentalRiskSnapshot = (
  location: ScreeningLocation,
  geocoded: GeocodingResult,
  reading: Awaited<ReturnType<typeof fetchAirQualityReading>>,
): EnvironmentalRiskSnapshot => {
  const pm25 = reading.pm25;
  return {
    location,
    geocodedName: geocoded.name,
    latitude: reading.latitude,
    longitude: reading.longitude,
    fetchedAt: new Date().toISOString(),
    pm25,
    pm10: reading.pm10,
    nitrogenDioxide: reading.nitrogenDioxide,
    usAqi: reading.usAqi,
    whoGuidelineRatio: pm25 === null ? null : Number((pm25 / WHO_PM25_GUIDELINE).toFixed(1)),
    exposureTier: exposureTierForPm25(pm25),
    lungCancerRiskFactors: lungCancerRiskFactorsFromReadings(pm25, reading.pm10, reading.nitrogenDioxide),
    dataLevel: "city",
    source: SOURCE_LABEL,
    sourceUrl: SOURCE_URL,
  };
};

export const fetchEnvironmentalRiskForLocation = async (location: ScreeningLocation, fetchImpl: typeof fetch = fetch) => {
  if (!location.region.trim() || !location.municipality.trim()) {
    return { ok: false as const, error: "Region and city/municipality are required." };
  }

  const cached = readCachedEnvironmentalRisk(location);
  if (cached) return { ok: true as const, snapshot: cached, fromCache: true as const };

  try {
    const geocoded = await fetchGeocodingResult(location, fetchImpl);
    const reading = await fetchAirQualityReading(geocoded.latitude, geocoded.longitude, fetchImpl);
    const snapshot = buildEnvironmentalRiskSnapshot(location, geocoded, reading);
    cacheEnvironmentalRisk(snapshot);
    return { ok: true as const, snapshot, fromCache: false as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Environmental data could not be loaded.";
    return { ok: false as const, error: message };
  }
};
