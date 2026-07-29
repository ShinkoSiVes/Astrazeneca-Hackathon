import type {
  ScreeningAlternativeField,
  ScreeningInputEvidenceItem,
  ScreeningInputMode,
} from "../local-screenings";
import { suggestScreeningChoice } from "../screening-choice-parser";

type ScreeningChoiceFieldProps = {
  field: ScreeningAlternativeField;
  label: string;
  value: string;
  options: readonly string[];
  mode: ScreeningInputMode;
  evidence?: ScreeningInputEvidenceItem;
  className?: string;
  onChange: (value: string) => void;
  onEvidenceChange: (evidence: ScreeningInputEvidenceItem) => void;
};

const emptyEvidence: ScreeningInputEvidenceItem = {
  rawText: "",
  suggestedValue: "",
  confirmedValue: "",
};

export function ScreeningChoiceField({
  field,
  label,
  value,
  options,
  mode,
  evidence = emptyEvidence,
  className = "",
  onChange,
  onEvidenceChange,
}: ScreeningChoiceFieldProps) {
  if (mode === "structured") {
    return (
      <label className={className}>
        {label}
        <select name={field} value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Select option</option>
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
    );
  }

  const suggestion = suggestScreeningChoice(field, evidence.rawText, options);
  const statusId = `${field}-interpretation-status`;
  const hasConfirmedCurrentText = Boolean(
    evidence.rawText.trim()
    && evidence.confirmedValue
    && evidence.confirmedValue === value,
  );

  const updateRawText = (rawText: string) => {
    const nextSuggestion = suggestScreeningChoice(field, rawText, options);
    onEvidenceChange({
      rawText,
      suggestedValue: nextSuggestion?.value ?? "",
      confirmedValue: "",
    });
    if (evidence.confirmedValue || value) onChange("");
  };

  const confirmSuggestion = () => {
    if (!suggestion) return;
    onChange(suggestion.value);
    onEvidenceChange({
      rawText: evidence.rawText,
      suggestedValue: suggestion.value,
      confirmedValue: suggestion.value,
    });
  };

  return (
    <div className={`screening-choice-field ${className}`.trim()}>
      <label htmlFor={`${field}-text-input`}>
        {label}
        <input
          id={`${field}-text-input`}
          name={field}
          value={evidence.rawText}
          onChange={(event) => updateRawText(event.target.value)}
          aria-describedby={statusId}
          aria-invalid={Boolean(evidence.rawText.trim() && !hasConfirmedCurrentText)}
          placeholder="Type the response in plain language"
        />
      </label>
      <div className="screening-choice-field__status" id={statusId} aria-live="polite">
        {hasConfirmedCurrentText ? (
          <p className="screening-choice-field__confirmed">Confirmed as <strong>{value}</strong>. Original text is retained.</p>
        ) : suggestion ? (
          <>
            <p>Closest local match: <strong>{suggestion.value}</strong></p>
            <button className="text-button" type="button" onClick={confirmSuggestion}>
              Confirm {suggestion.value}
            </button>
          </>
        ) : evidence.rawText.trim() ? (
          <p className="screening-choice-field__unresolved">No clear match. Reword the response to continue.</p>
        ) : value ? (
          <p>Current confirmed value: <strong>{value}</strong>. Type new wording only if it needs review.</p>
        ) : (
          <p>Enter a response, then confirm the suggested structured value.</p>
        )}
      </div>
    </div>
  );
}
