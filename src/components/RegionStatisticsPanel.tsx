import type { EnvironmentalRiskSnapshot } from "../environmental-risk";
import type { RegionStatistics } from "../region-statistics";

type RegionStatisticsPanelProps = {
  statistics: RegionStatistics;
  environmental: EnvironmentalRiskSnapshot | null;
  environmentalStatus: "idle" | "loading" | "ready" | "error";
  environmentalError: string;
  onClose: () => void;
  onRetryEnvironmental: () => void;
  onOpenRiskSummary: () => void;
};

export function RegionStatisticsPanel({
  statistics,
  environmental,
  environmentalStatus,
  environmentalError,
  onClose,
  onRetryEnvironmental,
  onOpenRiskSummary,
}: RegionStatisticsPanelProps) {
  return (
    <aside className="regional-detail region-statistics-panel" aria-live="polite">
      <div className="region-statistics-topline">
        <p className="card-kicker">Region statistics</p>
        <button className="text-button" type="button" onClick={onClose}>Back to region summary</button>
      </div>
      <h2>{statistics.regionLabel}</h2>
      <p>
        Region-level snapshot combining the public LCP case baseline, local screening profiles, and outdoor air quality at a regional reference point when online.
      </p>

      <dl>
        <div>
          <dt>Public risk level</dt>
          <dd>{statistics.publicRiskLevel}</dd>
        </div>
        <div>
          <dt>Public recorded cases</dt>
          <dd>{statistics.publicCasesLabel}</dd>
        </div>
        <div>
          <dt>App-screened in this region</dt>
          <dd>{statistics.appScreenedCount} unique profile{statistics.appScreenedCount === 1 ? "" : "s"}</dd>
        </div>
        <div>
          <dt>Share of local screenings</dt>
          <dd>
            {statistics.shareOfLocalScreeningsPercent === null
              ? "No eligible local profiles yet"
              : `${statistics.shareOfLocalScreeningsPercent}% of ${statistics.totalEligibleProfiles} heatmap-eligible profile${statistics.totalEligibleProfiles === 1 ? "" : "s"}`}
          </dd>
        </div>
      </dl>

      <button className="secondary-button region-statistics-button" type="button" onClick={onOpenRiskSummary}>
        Why this {statistics.publicRiskLevel.toLowerCase()} risk level
      </button>

      <section className="region-factor-section" aria-labelledby="region-env-title">
        <h3 id="region-env-title">Environmental air quality</h3>
        {environmentalStatus === "loading" && <p>Loading Open-Meteo PM2.5 for this region’s reference point…</p>}
        {environmentalStatus === "error" && (
          <p>
            {environmentalError || "Environmental data could not be loaded."}{" "}
            <button className="text-button" type="button" onClick={onRetryEnvironmental}>Retry</button>
          </p>
        )}
        {environmental ? (
          <dl>
            <div>
              <dt>PM2.5</dt>
              <dd>{environmental.pm25 ?? "—"} μg/m³ · {environmental.exposureTier}</dd>
            </div>
            <div>
              <dt>PM10</dt>
              <dd>{environmental.pm10 ?? "—"} μg/m³</dd>
            </div>
            <div>
              <dt>NO₂</dt>
              <dd>{environmental.nitrogenDioxide ?? "—"} μg/m³</dd>
            </div>
            <div>
              <dt>US AQI</dt>
              <dd>{environmental.usAqi ?? "—"}</dd>
            </div>
          </dl>
        ) : environmentalStatus === "idle" ? (
          <p className="region-factor-empty">Environmental context appears here when a reading is available.</p>
        ) : null}
        <small>
          Air quality uses an approximate regional reference point, not a full monitor network. It complements—not replaces—the LCP case baseline.
        </small>
      </section>

      <section className="region-factor-section" aria-labelledby="region-factor-title">
        <h3 id="region-factor-title">Top contributing factors</h3>
        <p>
          Percent of this region’s saved eligible profiles with each factor. Empty when no local profiles match this region.
        </p>
        {statistics.topRiskFactors.length === 0 ? (
          <p className="region-factor-empty">No local risk-factor bars yet for this region.</p>
        ) : (
          <ul className="region-factor-bars">
            {statistics.topRiskFactors.map((factor) => (
              <li key={factor.label}>
                <div className="region-factor-label">
                  <span>{factor.label}</span>
                  <strong>{factor.percent}%</strong>
                </div>
                <div className="region-factor-track" aria-hidden="true">
                  <span className="region-factor-fill" style={{ width: `${Math.max(factor.percent, 2)}%` }} />
                </div>
                <small>{factor.count} of {statistics.appScreenedCount} profile{statistics.appScreenedCount === 1 ? "" : "s"}</small>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="region-future-section" aria-labelledby="region-future-title">
        <h3 id="region-future-title">Future feature</h3>
        <p>These Miro planning-board views are not available from the current public or local sources:</p>
        <ul>
          {statistics.futureFeatures.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <small>
        Public cases remain LCP hospital-registry admissions by region of residence. Environmental readings and local bars are separate signals and are never summed into one invented prevalence rate.
      </small>
    </aside>
  );
}
