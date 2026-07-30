import type { KeyboardEvent } from "react";
import regionI from "../assets/philippines-regions/region-100000000.json";
import regionII from "../assets/philippines-regions/region-200000000.json";
import regionIII from "../assets/philippines-regions/region-300000000.json";
import calabarzon from "../assets/philippines-regions/region-400000000.json";
import bicol from "../assets/philippines-regions/region-500000000.json";
import westernVisayas from "../assets/philippines-regions/region-600000000.json";
import centralVisayas from "../assets/philippines-regions/region-700000000.json";
import easternVisayas from "../assets/philippines-regions/region-800000000-full.json";
import zamboanga from "../assets/philippines-regions/region-900000000.json";
import northernMindanao from "../assets/philippines-regions/region-1000000000.json";
import davao from "../assets/philippines-regions/region-1100000000.json";
import soccsksargen from "../assets/philippines-regions/region-1200000000.json";
import ncr from "../assets/philippines-regions/region-1300000000.json";
import car from "../assets/philippines-regions/region-1400000000.json";
import caraga from "../assets/philippines-regions/region-1600000000.json";
import mimaropa from "../assets/philippines-regions/region-1700000000.json";
import barmm from "../assets/philippines-regions/region-1900000000.json";

type SyntheticRegion = {
  id: string;
  label: string;
  signalLevel: string;
  syntheticRecords?: number;
};

type Position = [number, number];

type BoundaryFeature = {
  properties: { adm2_psgc?: number; adm2_en?: string };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: Position[][] | Position[][][];
  };
};

type BoundaryCollection = {
  features: BoundaryFeature[];
};

type MapRegionBoundary = {
  id: string;
  features: BoundaryFeature[];
};

const collection = (value: unknown) => value as BoundaryCollection;
const featureList = (value: unknown) => collection(value).features;
const excludedNirProvinces = new Set([604500000, 704600000, 706100000]);

/**
 * Static regional geometry for the offline demo. The underlying 2023 province
 * outlines are grouped to the PSA's current 18-region roster; NIR uses Negros
 * Occidental, Negros Oriental, and Siquijor.
 */
const mapRegionBoundaries: MapRegionBoundary[] = [
  { id: "region-i", features: featureList(regionI) },
  { id: "region-ii", features: featureList(regionII) },
  { id: "region-iii", features: featureList(regionIII) },
  { id: "region-iva", features: featureList(calabarzon) },
  { id: "region-v", features: featureList(bicol) },
  { id: "region-vi", features: featureList(westernVisayas).filter((feature) => !excludedNirProvinces.has(feature.properties.adm2_psgc ?? 0)) },
  { id: "nir", features: [...featureList(westernVisayas), ...featureList(centralVisayas)].filter((feature) => excludedNirProvinces.has(feature.properties.adm2_psgc ?? 0)) },
  { id: "region-vii", features: featureList(centralVisayas).filter((feature) => !excludedNirProvinces.has(feature.properties.adm2_psgc ?? 0)) },
  { id: "region-viii", features: featureList(easternVisayas) },
  { id: "region-ix", features: featureList(zamboanga) },
  { id: "region-x", features: featureList(northernMindanao) },
  { id: "region-xi", features: featureList(davao) },
  { id: "region-xii", features: featureList(soccsksargen) },
  { id: "ncr", features: featureList(ncr) },
  { id: "car", features: featureList(car) },
  { id: "caraga", features: featureList(caraga) },
  { id: "mimaropa", features: featureList(mimaropa) },
  { id: "barmm", features: featureList(barmm) },
];

const longitudeBounds = { min: 116.85, max: 126.7 };
const latitudeBounds = { min: 4.35, max: 21.4 };
const viewport = { width: 680, height: 780, horizontalPadding: 40, verticalPadding: 24 };

const project = ([longitude, latitude]: Position): [number, number] => {
  const usableWidth = viewport.width - viewport.horizontalPadding * 2;
  const usableHeight = viewport.height - viewport.verticalPadding * 2;
  const x = viewport.horizontalPadding + ((longitude - longitudeBounds.min) / (longitudeBounds.max - longitudeBounds.min)) * usableWidth;
  const y = viewport.verticalPadding + ((latitudeBounds.max - latitude) / (latitudeBounds.max - latitudeBounds.min)) * usableHeight;
  return [Number(x.toFixed(2)), Number(y.toFixed(2))];
};

const ringPath = (ring: Position[]) => ring.map((point, index) => {
  const [x, y] = project(point);
  return `${index === 0 ? "M" : "L"}${x} ${y}`;
}).join(" ") + " Z";

const featurePath = (feature: BoundaryFeature) => {
  const polygons = feature.geometry.type === "Polygon"
    ? [feature.geometry.coordinates as Position[][]]
    : feature.geometry.coordinates as Position[][][];
  return polygons.map((polygon) => polygon.map(ringPath).join(" ")).join(" ");
};

type PhilippinesRegionMapProps = {
  regions: SyntheticRegion[];
  screeningRegions?: SyntheticRegion[];
  selectedRegionId: string;
  onSelect: (regionId: string) => void;
  dataSource?: "public" | "app-screenings" | "combined";
};

type PhilippinesRegionMapPreviewProps = {
  regions: SyntheticRegion[];
};

export function PhilippinesRegionMapPreview({ regions }: PhilippinesRegionMapPreviewProps) {
  const boundariesById = new Map(mapRegionBoundaries.map((boundary) => [boundary.id, boundary.features]));

  return (
    <svg
      className="philippines-region-map philippines-region-map-preview"
      viewBox={`0 0 ${viewport.width} ${viewport.height / 2}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="map-preview-water" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eff9f7" />
          <stop offset="1" stopColor="#d8eee9" />
        </linearGradient>
        <filter id="map-preview-soft-shadow" x="-25%" y="-15%" width="150%" height="160%">
          <feDropShadow dx="0" dy="11" stdDeviation="8" floodColor="#0f5f61" floodOpacity=".19" />
        </filter>
      </defs>
      <rect className="map-preview-water" x="8" y="8" width={viewport.width - 16} height={viewport.height - 16} rx="48" />
      <g className="map-contour-lines">
        <path d="M72 170c95-52 158-44 228-2 73 45 156 51 272 3" />
        <path d="M74 405c92-50 161-44 232 2 76 47 163 50 270-4" />
        <path d="M78 637c98-45 171-39 235 4 80 49 160 51 257 9" />
      </g>
      <g filter="url(#map-preview-soft-shadow)">
        {regions.map((region) => {
          const paths = (boundariesById.get(region.id) ?? []).map(featurePath);

          return (
            <g className={`map-preview-region signal-${region.signalLevel.toLowerCase()}`} key={region.id}>
              <g className="map-region-depth">
                {paths.map((path, index) => <path className="map-region-extrusion" d={path} fillRule="evenodd" key={`${region.id}-preview-depth-${index}`} transform="translate(0 10)" />)}
              </g>
              <g className="map-region-surface">
                {paths.map((path, index) => <path className="map-region-shape" d={path} fillRule="evenodd" key={`${region.id}-preview-shape-${index}`} />)}
              </g>
            </g>
          );
        })}
      </g>
      <g className="map-compass-rose">
        <path className="map-compass-line" d="M622 62v64M590 94h64" />
        <path className="map-compass-needle map-compass-needle-north" d="M622 58l-8 36 8-7 8 7z" />
        <path className="map-compass-needle map-compass-needle-south" d="M622 130l-8-36 8 7 8-7z" />
        <circle className="map-compass-dot" cx="622" cy="94" r="3.5" />
        <text className="map-compass" x="622" y="49" textAnchor="middle">N</text>
        <text className="map-compass" x="670" y="98" textAnchor="middle">E</text>
        <text className="map-compass" x="622" y="145" textAnchor="middle">S</text>
        <text className="map-compass" x="574" y="98" textAnchor="middle">W</text>
      </g>
    </svg>
  );
}

export function PhilippinesRegionMap({ regions, screeningRegions = [], selectedRegionId, onSelect, dataSource = "public" }: PhilippinesRegionMapProps) {
  const boundariesById = new Map(mapRegionBoundaries.map((boundary) => [boundary.id, boundary.features]));
  const screeningRegionsById = new Map(screeningRegions.map((region) => [region.id, region]));
  const isCombined = dataSource === "combined";

  return (
    <section className="philippines-map-panel" aria-labelledby="region-map-title">
      <div className="map-panel-heading">
        <div>
          <p className="card-kicker">Interactive regional geometry</p>
          <h2 id="region-map-title">Philippines model</h2>
        </div>
        <span>18 regions</span>
      </div>
      <p className="map-panel-copy">{isCombined ? "Choose a region to compare its static public fill with the hatched app-screening overlay. The two source values remain separate." : dataSource === "app-screenings" ? "Choose a region to see only saved profiling drafts grouped by their selected region. Public baseline data is excluded." : "Choose a real administrative-region outline to inspect the static public baseline. App screening profiles are excluded."}</p>
      <div className="philippines-map-stage">
        <svg className="philippines-region-map" viewBox={`0 0 ${viewport.width} ${viewport.height}`} role="group" aria-label="Interactive Philippines model with 18 selectable administrative regions">
          <defs>
            <linearGradient id="map-water" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#eff9f7" />
              <stop offset="1" stopColor="#d8eee9" />
            </linearGradient>
            <filter id="map-soft-shadow" x="-25%" y="-15%" width="150%" height="160%">
              <feDropShadow dx="0" dy="11" stdDeviation="8" floodColor="#0f5f61" floodOpacity=".19" />
            </filter>
            <pattern id="screening-none-pattern" width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M-3 3L3-3M0 12L12 0M9 15L15 9" stroke="#267d78" strokeWidth="1.5" opacity=".12" />
            </pattern>
            <pattern id="screening-moderate-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M-2 2L2-2M0 10L10 0M8 12L12 8" stroke="#0c6865" strokeWidth="2" opacity=".68" />
            </pattern>
            <pattern id="screening-higher-pattern" width="7" height="7" patternUnits="userSpaceOnUse">
              <path d="M-2 2L2-2M0 7L7 0M5 9L9 5" stroke="#064f4d" strokeWidth="2.2" opacity=".82" />
            </pattern>
          </defs>
          <rect className="map-water" x="8" y="8" width={viewport.width - 16} height={viewport.height - 16} rx="48" />
          <g className="map-contour-lines" aria-hidden="true">
            <path d="M72 170c95-52 158-44 228-2 73 45 156 51 272 3" />
            <path d="M74 405c92-50 161-44 232 2 76 47 163 50 270-4" />
            <path d="M78 637c98-45 171-39 235 4 80 49 160 51 257 9" />
          </g>
          <g filter="url(#map-soft-shadow)">
            {regions.map((region) => {
              const paths = (boundariesById.get(region.id) ?? []).map(featurePath);
              const screeningRegion = screeningRegionsById.get(region.id);
              const screeningSignal = screeningRegion?.signalLevel.toLowerCase() ?? "lower";
              const isSelected = selectedRegionId === region.id;
              const selectFromKeyboard = (event: KeyboardEvent<SVGGElement>) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(region.id);
                }
              };

              return (
                <g
                  className={`map-region-group signal-${region.signalLevel.toLowerCase()} ${isCombined ? `combined screening-${screeningSignal}` : ""} ${isSelected ? "selected" : ""}`}
                  key={region.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${region.label}, ${isCombined ? `${region.signalLevel} static public baseline, ${screeningRegion?.syntheticRecords ?? 0} unique app screening profiles` : `${region.signalLevel} ${dataSource === "app-screenings" ? "app screening profile count" : "static public baseline"}`}`}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(region.id)}
                  onKeyDown={selectFromKeyboard}
                >
                  <g className="map-region-depth" aria-hidden="true">
                    {paths.map((path, index) => <path className="map-region-extrusion" d={path} fillRule="evenodd" key={`${region.id}-depth-${index}`} transform="translate(0 10)" />)}
                  </g>
                  <g className="map-region-surface">
                    {paths.map((path, index) => <path className="map-region-shape" d={path} fillRule="evenodd" key={`${region.id}-shape-${index}`} />)}
                    {isCombined && paths.map((path, index) => <path className="map-screening-overlay" d={path} fillRule="evenodd" key={`${region.id}-screening-${index}`} />)}
                  </g>
                </g>
              );
            })}
          </g>
          <g className="map-compass-rose" role="img" aria-label="Compass showing north, east, south, and west">
            <path className="map-compass-line" d="M622 62v64M590 94h64" aria-hidden="true" />
            <path className="map-compass-needle map-compass-needle-north" d="M622 58l-8 36 8-7 8 7z" aria-hidden="true" />
            <path className="map-compass-needle map-compass-needle-south" d="M622 130l-8-36 8 7 8-7z" aria-hidden="true" />
            <circle className="map-compass-dot" cx="622" cy="94" r="3.5" aria-hidden="true" />
            <text className="map-compass" x="622" y="49" textAnchor="middle" aria-hidden="true">N</text>
            <text className="map-compass" x="670" y="98" textAnchor="middle" aria-hidden="true">E</text>
            <text className="map-compass" x="622" y="145" textAnchor="middle" aria-hidden="true">S</text>
            <text className="map-compass" x="574" y="98" textAnchor="middle" aria-hidden="true">W</text>
          </g>
        </svg>
        <div className="map-depth-key" aria-label={isCombined ? "Static public signal and app-screening overlay keys" : dataSource === "app-screenings" ? "App-screening profile count key" : "Static public baseline key"}>
          {isCombined ? <>
            <span><i className="signal-lower" /> Public lower</span>
            <span><i className="signal-moderate" /> Public moderate</span>
            <span><i className="signal-higher" /> Public higher</span>
            <span><i className="screening-none" /> No app profiles</span>
            <span><i className="screening-moderate" /> 1–2 app profiles</span>
            <span><i className="screening-higher" /> 3+ app profiles</span>
          </> : dataSource === "app-screenings" ? <>
            <span><i className="signal-lower" /> No saved profiles</span>
            <span><i className="signal-moderate" /> 1–2 profiles</span>
            <span><i className="signal-higher" /> 3+ profiles</span>
          </> : <>
            <span><i className="signal-lower" /> Lower</span>
            <span><i className="signal-moderate" /> Moderate</span>
            <span><i className="signal-higher" /> Higher</span>
          </>}
        </div>
      </div>
      <p className="map-source-note">Boundary geometry: 2023 provincial snapshot, grouped to the PSA’s current 18-region roster. Static, offline, and for demo orientation only.</p>
    </section>
  );
}
