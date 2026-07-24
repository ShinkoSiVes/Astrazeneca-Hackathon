type TobaccoUseAmountProps = {
  frequency: string;
  packs: string;
  onFrequencyChange: (frequency: string) => void;
  onPacksChange: (packs: string) => void;
  frequencyInvalid?: boolean;
  packsInvalid?: boolean;
};

const noTobaccoUse = "Not a smoker";

const amountSummary = (packs: string, frequency: string) => {
  if (frequency === noTobaccoUse) return "No tobacco use reported.";
  if (packs && frequency) return `${packs} pack${packs === "1" ? "" : "s"} ${frequency.toLowerCase()}.`;
  if (frequency) return `Enter the estimated number of packs ${frequency.toLowerCase()}.`;
  return "Choose a frequency first, then record the estimated packs.";
};

export function TobaccoUseAmount({ frequency, packs, onFrequencyChange, onPacksChange, frequencyInvalid = false, packsInvalid = false }: TobaccoUseAmountProps) {
  const hasNoTobaccoUse = frequency === noTobaccoUse;

  const updateFrequency = (nextFrequency: string) => {
    onFrequencyChange(nextFrequency);
    if (nextFrequency === noTobaccoUse) onPacksChange("0");
    else if (frequency === noTobaccoUse) onPacksChange("");
  };

  return (
    <section className="tobacco-use-group" aria-labelledby="tobacco-use-heading">
      <div className="tobacco-use-group__heading">
        <span id="tobacco-use-heading">Tobacco-use amount</span>
        <span className="tobacco-use-group__step">Frequency → estimate</span>
      </div>
      <label className={frequencyInvalid ? "is-required-missing" : ""}>
        Tobacco-use frequency
        <select name="packFrequency" value={frequency} aria-invalid={frequencyInvalid} onChange={(event) => updateFrequency(event.target.value)}>
          <option value="">Select period first</option>
          <option>{noTobaccoUse}</option>
          <option>Per day</option>
          <option>Per week</option>
          <option>Per month</option>
          <option>Per year</option>
        </select>
      </label>
      <div className="tobacco-use-group__connector" aria-hidden="true"><span>Then estimate</span></div>
      <label className={packsInvalid ? "is-required-missing" : ""}>
        Estimated packs
        <input name="packYears" value={packs} aria-invalid={packsInvalid} onChange={(event) => onPacksChange(event.target.value)} inputMode="decimal" placeholder="e.g. 1.5" disabled={!frequency || hasNoTobaccoUse} />
      </label>
      <p className="tobacco-use-group__summary" aria-live="polite">{amountSummary(packs, frequency)}</p>
    </section>
  );
}
