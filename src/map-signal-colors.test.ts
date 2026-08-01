import { describe, expect, it } from "vitest";
import { heatmapColorAt, heatmapIntensity, heatmapPaletteForValue, rgbToCss, screeningOverlayOpacity } from "./map-signal-colors";

describe("map signal colors", () => {
  it("maps zero intensity to the lower mint stop and full intensity toward higher terracotta", () => {
    expect(rgbToCss(heatmapColorAt(0))).toBe("rgb(159 212 200)");
    expect(rgbToCss(heatmapColorAt(1))).toBe("rgb(224 139 106)");
    expect(rgbToCss(heatmapColorAt(0.5))).toBe("rgb(230 200 120)");
  });

  it("uses a log scale so mid-range case counts stay distinguishable from the max", () => {
    expect(heatmapIntensity(0, 1796)).toBe(0);
    expect(heatmapIntensity(1796, 1796)).toBe(1);
    expect(heatmapIntensity(95, 1796)).toBeGreaterThan(0.4);
    expect(heatmapIntensity(95, 1796)).toBeLessThan(0.7);
  });

  it("builds surface, edge, and highlight CSS colors for a value", () => {
    const palette = heatmapPaletteForValue(765, 1796);
    expect(palette.surface).toMatch(/^rgb\(/);
    expect(palette.edge).toMatch(/^rgb\(/);
    expect(palette.highlight).toMatch(/^rgb\(/);
    expect(palette.intensity).toBeGreaterThan(0.5);
  });

  it("scales screening overlay opacity with intensity", () => {
    expect(screeningOverlayOpacity(0)).toBeCloseTo(0.16);
    expect(screeningOverlayOpacity(1)).toBeCloseTo(0.58);
  });
});
