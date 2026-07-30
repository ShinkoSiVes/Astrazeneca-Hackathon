import type { EnvironmentalRiskSnapshot } from "../environmental-risk";
import type { RegionRiskSummary } from "../region-risk-summary";

type RegionRiskSummaryPanelProps = {
  summary: RegionRiskSummary;
  environmental: EnvironmentalRiskSnapshot | null;
  environmentalStatus: "idle" | "loading" | "ready" | "error";
  environmentalError: string;
  onClose: () => void;
  onRetryEnvironmental: () => void;
};

export function RegionRiskSummaryPanel({
  summary,
  environmental,
  environmentalStatus,
  environmentalError,
  onClose,
  onRetryEnvironmental,
}: RegionRiskSummaryPanelProps) {
  return (
    <aside className="regional-detail region-risk-summary-panel" aria-live="polite">
      <div className="region-statistics-topline">
        <p className="card-kicker">Risk explanation</p>
        <button className="text-button" type="button" onClick={onClose}>Back to region summary</button>
      </div>
      <h2>{summary.headline}</h2>
      <p className={`region-risk-level-chip signal-${summary.level.toLowerCase()}`}>{summary.level} public baseline</p>
      <ul className="region-risk-summary-list">
        {summary.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
      </ul>

      <section className="region-factor-section" aria-labelledby="region-env-summary-title">
        <h3 id="region-env-summary-title">Environmental context</h3>
        {environmentalStatus === "loading" && <p>Loading Open-Meteo air quality for a regional reference point…</p>}
        {environmentalStatus === "error" && (
          <p>
            {environmentalError || "Environmental data could not be loaded."}{" "}
            <button className="text-button" type="button" onClick={onRetryEnvironmental}>Retry</button>
          </p>
        )}
        {environmental && (
          <dl>
            <div>
              <dt>PM2.5</dt>
              <dd>{environmental.pm25 ?? "—"} μg/m³ · {environmental.exposureTier}</dd>
            </div>
            <div>
              <dt>US AQI</dt>
              <dd>{environmental.usAqi ?? "—"}</dd>
            </div>
            <div>
              <dt>Reference place</dt>
              <dd>{environmental.geocodedName}</dd>
            </div>
          </dl>
        )}
        <small>{summary.environmentalNote}</small>
      </section>

      <section className="region-future-section" aria-labelledby="region-summary-sources-title">
        <h3 id="region-summary-sources-title">Sources used</h3>
        <ul>
          {summary.sources.map((source) => <li key={source}>{source}</li>)}
        </ul>
      </section>
    </aside>
  );
}
