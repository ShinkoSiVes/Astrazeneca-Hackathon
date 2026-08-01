/** Continuous cool→warm heatmap palette (Lower mint → Moderate amber → Higher terracotta). */

export type MapRgb = { r: number; g: number; b: number };

export const MAP_SIGNAL_STOPS = {
  lower: { r: 159, g: 212, b: 200 }, // #9fd4c8
  moderate: { r: 230, g: 200, b: 120 }, // #e6c878
  higher: { r: 224, g: 139, b: 106 }, // #e08b6a
} as const;

const mixChannel = (from: number, to: number, t: number) => Math.round(from + (to - from) * t);

export const mixRgb = (from: MapRgb, to: MapRgb, t: number): MapRgb => ({
  r: mixChannel(from.r, to.r, t),
  g: mixChannel(from.g, to.g, t),
  b: mixChannel(from.b, to.b, t),
});

export const rgbToCss = ({ r, g, b }: MapRgb) => `rgb(${r} ${g} ${b})`;

export const shadeRgb = (color: MapRgb, amount: number): MapRgb => {
  if (amount >= 0) {
    return mixRgb(color, { r: 255, g: 255, b: 255 }, amount);
  }
  return mixRgb(color, { r: 40, g: 70, b: 68 }, -amount);
};

/** Smooth 0–1 intensity → heatmap color along the Lower → Moderate → Higher ramp. */
export const heatmapColorAt = (intensity: number): MapRgb => {
  const t = Math.min(1, Math.max(0, intensity));
  if (t <= 0.5) return mixRgb(MAP_SIGNAL_STOPS.lower, MAP_SIGNAL_STOPS.moderate, t * 2);
  return mixRgb(MAP_SIGNAL_STOPS.moderate, MAP_SIGNAL_STOPS.higher, (t - 0.5) * 2);
};

/** Log-scaled intensity so extreme outliers (e.g. NCR case counts) do not flatten every other region. */
export const heatmapIntensity = (value: number, maxValue: number) => {
  if (!(maxValue > 0) || !(value > 0)) return 0;
  return Math.log1p(value) / Math.log1p(maxValue);
};

export const heatmapPaletteForValue = (value: number, maxValue: number) => {
  const intensity = heatmapIntensity(value, maxValue);
  const surface = heatmapColorAt(intensity);
  return {
    intensity,
    surface: rgbToCss(surface),
    edge: rgbToCss(shadeRgb(surface, -0.28)),
    depth: rgbToCss(shadeRgb(surface, -0.18)),
    highlight: rgbToCss(shadeRgb(surface, 0.22)),
  };
};

/** Soft mint-gray wash for province outlines when public city/province LC counts are unavailable. */
export const unavailableMapPalette = () => ({
  intensity: 0,
  surface: "rgb(219 233 230)",
  edge: "rgb(120 157 152)",
  depth: "rgb(154 184 179)",
  highlight: "rgb(238 246 244)",
});

export const screeningOverlayOpacity = (intensity: number) => 0.16 + intensity * 0.42;
