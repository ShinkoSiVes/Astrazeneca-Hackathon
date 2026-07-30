import {
  WHO_PM25_GUIDELINE,
  exposureTierForPm25,
  fetchAirQualityReading,
  lungCancerRiskFactorsFromReadings,
  type EnvironmentalRiskSnapshot,
} from "./environmental-risk";

export type RegionCentroid = {
  id: string;
  latitude: number;
  longitude: number;
  referencePlace: string;
};

/** Approximate regional reference points for demo air-quality lookups (not official DOH monitors). */
export const regionCentroids: RegionCentroid[] = [
  { id: "ncr", latitude: 14.5995, longitude: 120.9842, referencePlace: "Manila" },
  { id: "region-iva", latitude: 14.211, longitude: 121.165, referencePlace: "Calamba" },
  { id: "region-iii", latitude: 15.0286, longitude: 120.6887, referencePlace: "San Fernando, Pampanga" },
  { id: "region-i", latitude: 16.6159, longitude: 120.3168, referencePlace: "San Fernando, La Union" },
  { id: "region-v", latitude: 13.1391, longitude: 123.7437, referencePlace: "Legazpi" },
  { id: "region-ii", latitude: 17.6131, longitude: 121.727, referencePlace: "Tuguegarao" },
  { id: "mimaropa", latitude: 13.4115, longitude: 121.1803, referencePlace: "Calapan" },
  { id: "region-viii", latitude: 11.244, longitude: 125.0039, referencePlace: "Tacloban" },
  { id: "region-vi", latitude: 10.7202, longitude: 122.5621, referencePlace: "Iloilo City" },
  { id: "car", latitude: 16.4023, longitude: 120.596, referencePlace: "Baguio" },
  { id: "nir", latitude: 10.677, longitude: 122.9511, referencePlace: "Bacolod" },
  { id: "region-vii", latitude: 10.3157, longitude: 123.8854, referencePlace: "Cebu City" },
  { id: "region-ix", latitude: 6.9214, longitude: 122.079, referencePlace: "Zamboanga City" },
  { id: "region-xii", latitude: 6.5033, longitude: 124.8469, referencePlace: "Koronadal" },
  { id: "region-x", latitude: 8.4542, longitude: 124.6319, referencePlace: "Cagayan de Oro" },
  { id: "region-xi", latitude: 7.1907, longitude: 125.4553, referencePlace: "Davao City" },
  { id: "caraga", latitude: 8.9475, longitude: 125.5406, referencePlace: "Butuan" },
  { id: "barmm", latitude: 7.2047, longitude: 124.231, referencePlace: "Cotabato City" },
];

export const regionEnvironmentalCacheKey = "aeris-region-environmental-cache-v1";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const SOURCE_LABEL = "Open-Meteo Air Quality API (Copernicus CAMS)";
const SOURCE_URL = "https://open-meteo.com/en/docs/air-quality-api";

export const centroidForRegion = (regionId: string) => regionCentroids.find((entry) => entry.id === regionId) ?? null;

const readCache = (): Record<string, EnvironmentalRiskSnapshot> => {
  try {
    const parsed = JSON.parse(localStorage.getItem(regionEnvironmentalCacheKey) ?? "{}") as Record<string, EnvironmentalRiskSnapshot>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const readCachedRegionEnvironmentalRisk = (regionId: string) => {
  const cached = readCache()[regionId];
  if (!cached) return null;
  const ageMs = Date.now() - Date.parse(cached.fetchedAt);
  return ageMs <= CACHE_TTL_MS ? cached : null;
};

export const cacheRegionEnvironmentalRisk = (regionId: string, snapshot: EnvironmentalRiskSnapshot) => {
  const cache = readCache();
  cache[regionId] = snapshot;
  localStorage.setItem(regionEnvironmentalCacheKey, JSON.stringify(cache));
};

export const buildRegionEnvironmentalSnapshot = (
  regionId: string,
  regionLabel: string,
  centroid: RegionCentroid,
  reading: Awaited<ReturnType<typeof fetchAirQualityReading>>,
): EnvironmentalRiskSnapshot => {
  const pm25 = reading.pm25;
  return {
    location: {
      region: regionLabel,
      municipality: `${centroid.referencePlace} — regional reference`,
      barangay: "",
    },
    geocodedName: `${centroid.referencePlace} (regional reference)`,
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

export const fetchEnvironmentalRiskForRegion = async (
  regionId: string,
  regionLabel: string,
  fetchImpl: typeof fetch = fetch,
) => {
  const centroid = centroidForRegion(regionId);
  if (!centroid) return { ok: false as const, error: "No regional reference point is configured for this area." };

  const cached = readCachedRegionEnvironmentalRisk(regionId);
  if (cached) return { ok: true as const, snapshot: cached, fromCache: true as const };

  try {
    const reading = await fetchAirQualityReading(centroid.latitude, centroid.longitude, fetchImpl);
    const snapshot = buildRegionEnvironmentalSnapshot(regionId, regionLabel, centroid, reading);
    cacheRegionEnvironmentalRisk(regionId, snapshot);
    return { ok: true as const, snapshot, fromCache: false as const };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false as const, error: "Environmental request cancelled." };
    }
    const message = error instanceof Error ? error.message : "Regional environmental data could not be loaded.";
    return { ok: false as const, error: message };
  }
};
