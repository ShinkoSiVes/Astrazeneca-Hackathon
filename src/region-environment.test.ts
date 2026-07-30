import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildRegionEnvironmentalSnapshot,
  cacheRegionEnvironmentalRisk,
  centroidForRegion,
  fetchEnvironmentalRiskForRegion,
  readCachedRegionEnvironmentalRisk,
  regionEnvironmentalCacheKey,
} from "./region-environment";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("region environmental helpers", () => {
  it("resolves regional centroids for PSA-aligned ids", () => {
    expect(centroidForRegion("ncr")?.referencePlace).toBe("Manila");
    expect(centroidForRegion("region-iii")?.referencePlace).toMatch(/San Fernando/i);
    expect(centroidForRegion("missing")).toBeNull();
  });

  it("builds a regional environmental snapshot from an air-quality reading", () => {
    const centroid = centroidForRegion("region-iii")!;
    const snapshot = buildRegionEnvironmentalSnapshot("region-iii", "Region III — Central Luzon", centroid, {
      latitude: centroid.latitude,
      longitude: centroid.longitude,
      pm25: 12.4,
      pm10: 18,
      nitrogenDioxide: 22,
      usAqi: 51,
    });

    expect(snapshot.exposureTier).toBe("Moderate");
    expect(snapshot.geocodedName).toMatch(/regional reference/i);
    expect(snapshot.source).toContain("Open-Meteo");
  });

  it("caches and reuses regional environmental lookups", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        latitude: 15.03,
        longitude: 120.69,
        current: { pm2_5: 16.5, pm10: 21, nitrogen_dioxide: 19, us_aqi: 60 },
      }),
    });

    const first = await fetchEnvironmentalRiskForRegion("region-iii", "Region III — Central Luzon", fetchImpl as typeof fetch);
    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.fromCache).toBe(false);
      expect(first.snapshot.pm25).toBe(16.5);
      cacheRegionEnvironmentalRisk("region-iii", first.snapshot);
    }

    const cached = readCachedRegionEnvironmentalRisk("region-iii");
    expect(cached?.pm25).toBe(16.5);
    expect(localStorage.getItem(regionEnvironmentalCacheKey)).toContain("region-iii");

    const second = await fetchEnvironmentalRiskForRegion("region-iii", "Region III — Central Luzon", fetchImpl as typeof fetch);
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.fromCache).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
