import { describe, expect, it } from "vitest";
import { normaliseScreeningChoiceText, suggestScreeningChoice } from "./screening-choice-parser";

describe("screening choice parser", () => {
  it("normalises punctuation, casing, and accents locally", () => {
    expect(normaliseScreeningChoiceText("  PÓSITIVE!!! ")).toBe("positive");
  });

  it("maps common clinical wording to a canonical response", () => {
    expect(suggestScreeningChoice("persistentCough", "negative", ["Yes", "No", "Unknown"])?.value).toBe("No");
    expect(suggestScreeningChoice("persistentCough", "yes, for around three weeks", ["Yes", "No", "Unknown"])?.value).toBe("Yes");
    expect(suggestScreeningChoice("smokingStatus", "used to smoke", ["Current smoker", "Former smoker", "Never smoker"])?.value).toBe("Former smoker");
  });

  it("uses field-aware wording without applying it to other fields", () => {
    expect(suggestScreeningChoice("previousSurveyResponse", "first time", ["Yes", "No"])?.value).toBe("No");
    expect(suggestScreeningChoice("chestXrayAvailable", "x-ray available", ["Yes", "No"])?.value).toBe("Yes");
  });

  it("does not invent a match for unrelated text", () => {
    expect(suggestScreeningChoice("asthma", "review this later", ["Yes", "No", "Unknown"])).toBeNull();
  });
});
