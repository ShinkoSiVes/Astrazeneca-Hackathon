import type { EnvironmentalRiskSnapshot } from "../environmental-risk";

type EnvironmentalRiskPanelProps = {
  status: "idle" | "loading" | "ready" | "error";
  snapshot: EnvironmentalRiskSnapshot | null;
  errorMessage?: string;
  onRetry?: () => void;
};

export function EnvironmentalRiskPanel({ status, snapshot, errorMessage, onRetry }: EnvironmentalRiskPanelProps) {
  if (status === "idle") {
    return <p className="field-note wide-field environmental-risk-panel">Select a region and city/municipality to load live air-quality data for this location.</p>;
  }

  if (status === "loading") {
    return <p className="field-note wide-field environmental-risk-panel" role="status">Loading live environmental air-quality data for the selected location…</p>;
  }

  if (status === "error") {
    return (
      <div className="environmental-risk-panel environmental-risk-panel--error wide-field" role="alert">
        <p><strong>Environmental data unavailable.</strong> {errorMessage ?? "The public air-quality service could not be reached."}</p>
        {onRetry ? <button className="secondary-button" type="button" onClick={onRetry}>Retry environmental lookup</button> : null}
      </div>
    );
  }

  if (!snapshot) return null;

  return (
    <section className="environmental-risk-panel wide-field" aria-labelledby="environmental-risk-title">
      <div className="environmental-risk-panel__topline">
        <p id="environmental-risk-title" className="card-kicker">Location environmental profile</p>
        <span className="status-chip">{snapshot.exposureTier} exposure</span>
      </div>
      <p className="environmental-risk-panel__lead">
        Live air-quality reading for <strong>{snapshot.geocodedName}</strong>
        {snapshot.location.barangay.trim() ? ` (barangay ${snapshot.location.barangay} uses the nearest city estimate)` : ""}.
      </p>
      <dl className="environmental-risk-panel__metrics">
        <div><dt>PM2.5</dt><dd>{snapshot.pm25 ?? "—"} μg/m³</dd></div>
        <div><dt>PM10</dt><dd>{snapshot.pm10 ?? "—"} μg/m³</dd></div>
        <div><dt>Nitrogen dioxide</dt><dd>{snapshot.nitrogenDioxide ?? "—"} μg/m³</dd></div>
        <div><dt>US AQI</dt><dd>{snapshot.usAqi ?? "—"}</dd></div>
        <div><dt>WHO guideline ratio</dt><dd>{snapshot.whoGuidelineRatio ?? "—"}× (5 μg/m³)</dd></div>
      </dl>
      <div className="environmental-risk-panel__factors">
        <strong>Lung-cancer-relevant factors</strong>
        <ul>
          {snapshot.lungCancerRiskFactors.map((factor) => <li key={factor}>{factor}</li>)}
        </ul>
      </div>
      <small>
        Source: {snapshot.source}. Fetched {new Date(snapshot.fetchedAt).toLocaleString()}. Stored locally for future risk estimation; not used in the current demo calculator.
      </small>
    </section>
  );
}
