import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildEnvironmentalRiskSnapshot,
  cacheEnvironmentalRisk,
  environmentalRiskCacheKey,
  exposureTierForPm25,
  fetchEnvironmentalRiskForLocation,
  geocodingSearchName,
  locationStorageKey,
  lungCancerRiskFactorsFromReadings,
  parseMunicipalityLabel,
  pickGeocodingResult,
  readCachedEnvironmentalRisk,
  regionSearchHints,
} from "./environmental-risk";

const location = {
  region: "National Capital Region (NCR)",
  municipality: "City of Pasig — Metro Manila",
  barangay: "San Antonio",
};

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("environmental risk helpers", () => {
  it("parses municipality labels and geocoding search names", () => {
    expect(parseMunicipalityLabel("City of Makati — Metro Manila")).toEqual({ name: "City of Makati", province: "Metro Manila" });
    expect(geocodingSearchName("City of Makati")).toBe("Makati");
  });

  it("prefers geocoding matches inside the selected region", () => {
    const results = [
      { name: "Pasig", latitude: 14.58, longitude: 121.06, admin1: "National Capital Region", population: 800_000, feature_code: "PPLA2" },
      { name: "Pasig", latitude: 15.09, longitude: 120.81, admin1: "Central Luzon", admin2: "Province of Pampanga", population: 1000, feature_code: "PPL" },
    ];
    const match = pickGeocodingResult(results, location.region, "Metro Manila");
    expect(match?.admin1).toBe("National Capital Region");
  });

  it("derives lung-cancer-relevant factors from pollutant readings", () => {
    expect(lungCancerRiskFactorsFromReadings(16, 22, 30).some((factor) => factor.includes("PM2.5"))).toBe(true);
    expect(lungCancerRiskFactorsFromReadings(4, 8, 10)[0]).toContain("no elevated");
    expect(exposureTierForPm25(16)).toBe("Higher");
  });

  it("builds a snapshot with source metadata", () => {
    const snapshot = buildEnvironmentalRiskSnapshot(location, { name: "Pasig", latitude: 14.58, longitude: 121.06 }, {
      latitude: 14.58,
      longitude: 121.06,
      pm25: 12.1,
      pm10: 12.5,
      nitrogenDioxide: 21.8,
      usAqi: 53,
    });

    expect(snapshot.geocodedName).toBe("Pasig");
    expect(snapshot.exposureTier).toBe("Moderate");
    expect(snapshot.source).toContain("Open-Meteo");
    expect(regionSearchHints("Region III — Central Luzon")).toContain("centralluzon");
  });
});

describe("environmental risk fetch + cache", () => {
  it("caches successful lookups by location key", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ name: "Pasig", latitude: 14.58, longitude: 121.06, admin1: "National Capital Region", population: 800_000, feature_code: "PPLA2" }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ latitude: 14.58, longitude: 121.06, current: { pm2_5: 12.1, pm10: 12.5, nitrogen_dioxide: 21.8, us_aqi: 53 } }),
      });

    const first = await fetchEnvironmentalRiskForLocation(location, fetchImpl as typeof fetch);
    expect(first.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);

    const cached = readCachedEnvironmentalRisk(location);
    expect(cached?.pm25).toBe(12.1);
    expect(locationStorageKey(location)).toBeTruthy();
    expect(localStorage.getItem(environmentalRiskCacheKey)).toContain("Pasig");

    const second = await fetchEnvironmentalRiskForLocation(location, fetchImpl as typeof fetch);
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.fromCache).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("stores snapshots through the cache helper", () => {
    const snapshot = buildEnvironmentalRiskSnapshot(location, { name: "Pasig", latitude: 14.58, longitude: 121.06 }, {
      latitude: 14.58,
      longitude: 121.06,
      pm25: 9,
      pm10: 11,
      nitrogenDioxide: 12,
      usAqi: 40,
    });
    cacheEnvironmentalRisk(snapshot);
    expect(readCachedEnvironmentalRisk(location)?.pm25).toBe(9);
  });
});
