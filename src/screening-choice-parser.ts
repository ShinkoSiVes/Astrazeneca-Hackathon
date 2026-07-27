import type { ScreeningAlternativeField } from "./local-screenings";

export type ScreeningChoiceSuggestion = {
  value: string;
  confidence: number;
};

const commonAliases: Record<string, string[]> = {
  Yes: ["y", "yeah", "positive", "present", "has it", "available", "true"],
  No: ["n", "negative", "none", "absent", "does not", "doesn't", "not available", "false"],
  Unknown: ["unsure", "not sure", "unknown", "do not know", "don't know", "not known", "information unavailable"],
  Female: ["f", "woman", "girl"],
  Male: ["m", "man", "boy"],
  Intersex: ["intersex variation"],
  "Prefer not to record": ["prefer not to say", "declined", "not disclosed"],
  "Current smoker": ["current", "smokes now", "still smoking", "active smoker", "smoker"],
  "Former smoker": ["former", "used to smoke", "quit smoking", "ex smoker", "ex-smoker"],
  "Never smoker": ["never", "never smoked", "non smoker", "non-smoker", "does not smoke"],
};

const fieldAliases: Partial<Record<ScreeningAlternativeField, Record<string, string[]>>> = {
  chestXrayAvailable: {
    Yes: ["xray available", "x ray available", "has xray", "has x ray"],
    No: ["no xray", "no x ray", "xray unavailable", "x ray unavailable"],
  },
  previousSurveyResponse: {
    Yes: ["surveyed before", "previous survey", "answered before", "repeat participant"],
    No: ["first survey", "first time", "not surveyed before", "new participant"],
  },
};

export const normaliseScreeningChoiceText = (value: string) => value
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim()
  .replace(/\s+/g, " ");

const editDistance = (left: string, right: string) => {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
};

const similarity = (left: string, right: string) => {
  if (!left || !right) return 0;
  if (left === right) return 1;
  const distance = editDistance(left, right);
  return 1 - distance / Math.max(left.length, right.length);
};

export const suggestScreeningChoice = (
  field: ScreeningAlternativeField,
  rawText: string,
  options: readonly string[],
): ScreeningChoiceSuggestion | null => {
  const input = normaliseScreeningChoiceText(rawText);
  if (!input) return null;

  const ranked = options.map((option) => {
    const candidates = [
      option,
      ...(commonAliases[option] ?? []),
      ...(fieldAliases[field]?.[option] ?? []),
    ].map(normaliseScreeningChoiceText);
    const confidence = Math.max(...candidates.map((candidate) => {
      if (input === candidate) return 1;
      if (candidate.length >= 2 && input.split(" ").includes(candidate)) return 0.92;
      if (candidate.length >= 4 && (input.includes(candidate) || candidate.includes(input))) return 0.86;
      return similarity(input, candidate);
    }));
    return { value: option, confidence };
  }).sort((left, right) => right.confidence - left.confidence);

  return ranked[0]?.confidence >= 0.45 ? ranked[0] : null;
};
