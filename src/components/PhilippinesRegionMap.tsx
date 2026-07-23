import type { KeyboardEvent } from "react";

type SyntheticRegion = {
  id: string;
  label: string;
  signalLevel: string;
};

type MapRegionShape = {
  path: string;
  x: number;
  y: number;
};

const mapRegionShapes: MapRegionShape[] = [
  { path: "M252 32 282 44 292 78 276 102 246 94 232 70Z", x: 262, y: 67 },
  { path: "M178 86 218 96 226 132 204 157 166 143 154 112Z", x: 190, y: 121 },
  { path: "M284 112 324 126 330 166 306 190 268 174 264 140Z", x: 298, y: 151 },
  { path: "M210 174 252 186 260 228 238 252 194 238 184 204Z", x: 221, y: 213 },
  { path: "M300 204 348 218 354 260 324 286 282 270 278 232Z", x: 316, y: 246 },
  { path: "M142 254 192 264 206 304 182 334 136 322 122 286Z", x: 163, y: 294 },
  { path: "M238 278 286 292 294 332 268 360 224 346 216 310Z", x: 255, y: 320 },
  { path: "M334 296 376 310 382 350 358 374 318 360 312 326Z", x: 347, y: 335 },
  { path: "M176 350 222 362 234 404 210 430 168 416 158 380Z", x: 196, y: 393 },
  { path: "M274 374 320 388 330 430 304 456 262 442 254 404Z", x: 292, y: 417 },
  { path: "M362 386 402 400 408 438 384 462 346 450 340 414Z", x: 374, y: 426 },
  { path: "M214 456 262 470 272 514 246 542 202 528 194 486Z", x: 233, y: 499 },
  { path: "M316 470 366 486 374 530 346 558 300 542 294 502Z", x: 334, y: 514 },
  { path: "M132 540 180 550 194 592 168 620 124 606 116 568Z", x: 155, y: 581 },
  { path: "M238 556 284 568 294 610 270 638 228 624 218 586Z", x: 256, y: 599 },
  { path: "M344 556 390 570 398 612 374 638 330 624 322 584Z", x: 360, y: 599 },
  { path: "M196 642 244 654 252 690 230 712 188 700 180 666Z", x: 216, y: 678 },
  { path: "M292 648 342 662 348 700 322 722 278 708 270 672Z", x: 309, y: 686 },
];

type PhilippinesRegionMapProps = {
  regions: SyntheticRegion[];
  selectedRegionId: string;
  onSelect: (regionId: string) => void;
};

export function PhilippinesRegionMap({ regions, selectedRegionId, onSelect }: PhilippinesRegionMapProps) {
  return (
    <section className="philippines-map-panel" aria-labelledby="region-map-title">
      <div className="map-panel-heading">
        <div>
          <p className="card-kicker">Interactive selection surface</p>
          <h2 id="region-map-title">Philippines model</h2>
        </div>
        <span>18 synthetic fixtures</span>
      </div>
      <p className="map-panel-copy">Choose a numbered illustrative area to inspect its local demo fixture. These placeholders do not represent administrative boundaries or a clinical-risk map.</p>
      <div className="philippines-map-stage">
        <svg className="philippines-region-map" viewBox="0 0 520 750" role="group" aria-label="Interactive Philippines model with 18 synthetic region fixtures">
          <defs>
            <linearGradient id="map-water" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#eef8f6" />
              <stop offset="1" stopColor="#dbeee9" />
            </linearGradient>
            <filter id="map-soft-shadow" x="-30%" y="-20%" width="160%" height="170%">
              <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#0f5f61" floodOpacity=".18" />
            </filter>
          </defs>
          <rect className="map-water" x="12" y="12" width="496" height="726" rx="48" />
          <g className="map-contour-lines" aria-hidden="true">
            <path d="M82 168c72-56 120-48 170-4 56 48 108 56 176 5" />
            <path d="M72 372c68-47 126-42 179 2 58 47 123 52 197-4" />
            <path d="M80 562c76-50 135-43 181 1 58 52 120 54 175 12" />
          </g>
          <g filter="url(#map-soft-shadow)">
            {regions.slice(0, mapRegionShapes.length).map((region, index) => {
              const shape = mapRegionShapes[index];
              const isSelected = selectedRegionId === region.id;
              const selectFromKeyboard = (event: KeyboardEvent<SVGGElement>) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(region.id);
                }
              };

              return (
                <g
                  className={`map-region-group signal-${region.signalLevel.toLowerCase()} ${isSelected ? "selected" : ""}`}
                  key={region.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${region.label}, ${region.signalLevel} synthetic signal`}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(region.id)}
                  onKeyDown={selectFromKeyboard}
                >
                  <path className="map-region-extrusion" d={shape.path} transform="translate(0 11)" />
                  <path className="map-region-shape" d={shape.path} />
                  <text className="map-region-label" x={shape.x} y={shape.y} textAnchor="middle" dominantBaseline="middle" aria-hidden="true">{String(index + 1).padStart(2, "0")}</text>
                </g>
              );
            })}
          </g>
          <text className="map-compass" x="462" y="62" textAnchor="middle" aria-hidden="true">N</text>
          <path className="map-compass-line" d="M462 74v38" aria-hidden="true" />
          <circle className="map-compass-dot" cx="462" cy="116" r="3" aria-hidden="true" />
        </svg>
        <div className="map-depth-key" aria-label="Synthetic signal key">
          <span><i className="signal-lower" /> Lower</span>
          <span><i className="signal-moderate" /> Moderate</span>
          <span><i className="signal-higher" /> Higher</span>
        </div>
      </div>
    </section>
  );
}
