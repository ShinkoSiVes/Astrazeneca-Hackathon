import type { EnvironmentalRiskSnapshot } from "./environmental-risk";
import type { LocalScreeningDraft } from "./local-screenings";
import {
  bmiFromMetric,
  estimatePlcom2012NoRace,
  type PlcoContribution,
  type PlcoEducationLevel,
  type PlcoNoRaceEstimate,
} from "./plcom2012-norace";

export type ClinicalFlag = {
  id: string;
  label: string;
  severity: "urgent" | "attention";
};

export type LocalConsiderationStatus = "present" | "absent" | "unknown" | "context";

export type LocalClinicalConsideration = {
  id: string;
  category:
    | "never-smoker"
    | "indoor-air"
    | "outdoor-air"
    | "occupational"
    | "tb-history"
    | "genetic-context";
  title: string;
  detail: string;
  status: LocalConsiderationStatus;
  priority: "high" | "moderate" | "context";
  recordedSignal: string;
};

export type AerisRiskEstimate = {
  /** 6-year lung-cancer probability as percent, or null when model not applicable */
  percent: number | null;
  probability: number | null;
  band: "Lower" | "Intermediate" | "Elevated" | "Unavailable";
  bandLabel: string;
  applicable: boolean;
  unavailableReason: string | null;
  contributions: PlcoContribution[];
  clinicalFlags: ClinicalFlag[];
  /** Local / population factors for clinician judgment — never mixed into PLCO % */
  localConsiderations: LocalClinicalConsideration[];
  modelId: "PLCOm2012noRace";
  modelVersion: string;
  methodNote: string;
  eligibilityNote: string;
  considerationsNote: string;
  usedEnvironmental: boolean;
  usedPublicRegion: false;
  inputsSummary: {
    ageYears: number | null;
    education: PlcoEducationLevel | null;
    bmi: number | null;
    cigarettesPerDay: number | null;
    yearsSmoked: number | null;
    yearsSinceQuit: number | null;
    packYearsDerived: number | null;
  };
};

const parseNumber = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const isYes = (value: string) => value === "Yes";

const checklistItems = (value: string) => value.split(" | ").map((item) => item.trim()).filter(Boolean);

const parseEducation = (value: string): PlcoEducationLevel | null => {
  const parsed = Number.parseInt(value, 10);
  if (parsed >= 1 && parsed <= 6) return parsed as PlcoEducationLevel;
  return null;
};

export const clinicalFlagsFromScreening = (screening: LocalScreeningDraft): ClinicalFlag[] => {
  const flags: ClinicalFlag[] = [];
  if (isYes(screening.bloodInSputum)) flags.push({ id: "hemoptysis", label: "Hemoptysis reported", severity: "urgent" });
  if (isYes(screening.weightLoss)) {
    flags.push({
      id: "weight-loss",
      label: screening.weightLossAmount.trim() ? `Weight loss (${screening.weightLossAmount.trim()})` : "Weight loss reported",
      severity: "urgent",
    });
  }
  if (isYes(screening.persistentCough)) flags.push({ id: "cough", label: "Persistent cough reported", severity: "attention" });
  if (isYes(screening.breathlessness)) flags.push({ id: "breathlessness", label: "Dyspnea reported", severity: "attention" });
  if (isYes(screening.chestPain)) flags.push({ id: "chest-pain", label: "Chest pain reported", severity: "attention" });
  if (isYes(screening.hoarseness)) flags.push({ id: "hoarseness", label: "Hoarseness reported", severity: "attention" });
  if (isYes(screening.fatigue)) flags.push({ id: "fatigue", label: "Fatigue reported", severity: "attention" });
  return flags;
};

/**
 * Local Philippine / East–Southeast Asian context factors for clinician review.
 * These are deliberately excluded from the PLCOm2012noRace probability.
 */
export const localConsiderationsFromScreening = (
  screening: LocalScreeningDraft,
  environmental: EnvironmentalRiskSnapshot | null = null,
): LocalClinicalConsideration[] => {
  const exposures = checklistItems(screening.occupationalExposure);
  const isNeverSmoker = screening.smokingStatus === "Never smoker" || screening.smokingStatus === "Never smoked";
  const isFemale = screening.sexAtBirth === "Female";
  const secondhand = isYes(screening.householdSmoke) || exposures.includes("Secondhand smoke");
  const biomass = exposures.includes("Biomass fuel exposure");
  const occupationalHits = exposures.filter((item) => ["Asbestos", "Silica", "Mining", "Construction"].includes(item));

  const neverSmoker: LocalClinicalConsideration = (() => {
    if (isNeverSmoker && isFemale) {
      return {
        id: "never-smoker",
        category: "never-smoker",
        title: "Never-smoker lung cancer pattern (esp. women)",
        detail: "PLCOm2012noRace was built on ever-smokers and will not score this patient. East and Southeast Asian populations show a distinct never-smoker lung-cancer pattern, especially in women, linked to cooking fumes and secondhand smoke. Do not treat a missing PLCO % as low risk.",
        status: "present",
        priority: "high",
        recordedSignal: `Never smoker · sex at birth: ${screening.sexAtBirth || "not recorded"}`,
      };
    }
    if (isNeverSmoker) {
      return {
        id: "never-smoker",
        category: "never-smoker",
        title: "Never-smoker — outside PLCOm2012noRace",
        detail: "This model under-flags lifelong non-smokers. Review cooking exposure, secondhand smoke, symptoms, TB history, and imaging pathway separately.",
        status: "present",
        priority: "high",
        recordedSignal: "Never smoker",
      };
    }
    return {
      id: "never-smoker",
      category: "never-smoker",
      title: "Never-smoker population gap",
      detail: "Patient is an ever-smoker, so PLCOm2012noRace may apply. Still remember never-smoker East/Southeast Asian lung-cancer patterns when interpreting community screening results.",
      status: "absent",
      priority: "context",
      recordedSignal: screening.smokingStatus || "Smoking status not recorded",
    };
  })();

  const indoorAir: LocalClinicalConsideration = (() => {
    const signals: string[] = [];
    if (biomass) signals.push("Biomass / solid-fuel cooking exposure");
    if (secondhand) signals.push("Secondhand / household smoke");
    if (signals.length) {
      return {
        id: "indoor-air",
        category: "indoor-air",
        title: "Indoor air / cooking fuel exposure",
        detail: "PLCOm2012noRace has no term for cooking fuel, wok frying fumes, or home ventilation. Treat recorded indoor exposures as clinician judgment factors.",
        status: "present",
        priority: "high",
        recordedSignal: signals.join(" · "),
      };
    }
    if (exposures.includes("Unknown") || screening.householdSmoke === "Unknown") {
      return {
        id: "indoor-air",
        category: "indoor-air",
        title: "Indoor air / cooking fuel exposure",
        detail: "Cooking fuel type and household ventilation were not confirmed. Ask about wood/charcoal stoves, high-heat frying, and household smoke — especially for never-smokers.",
        status: "unknown",
        priority: "moderate",
        recordedSignal: "Indoor exposure unknown or not detailed",
      };
    }
    return {
      id: "indoor-air",
      category: "indoor-air",
      title: "Indoor air / cooking fuel exposure",
      detail: "No biomass or secondhand-smoke signal was recorded. Confirm cooking fuel and kitchen ventilation if symptoms or never-smoker status raise concern.",
      status: "absent",
      priority: "context",
      recordedSignal: "No indoor fuel / secondhand smoke signal recorded",
    };
  })();

  const outdoorAir: LocalClinicalConsideration = (() => {
    if (environmental?.pm25 != null) {
      return {
        id: "outdoor-air",
        category: "outdoor-air",
        title: "Outdoor ambient air pollution (PM2.5)",
        detail: "Ambient PM2.5 is not a PLCOm2012noRace predictor (US-derived model). Use the live reading as local context only — it does not change the calculator percentage.",
        status: "present",
        priority: environmental.pm25 >= 15 ? "high" : "moderate",
        recordedSignal: `PM2.5 ${environmental.pm25} μg/m³ · ${environmental.exposureTier} · ${environmental.geocodedName}`,
      };
    }
    return {
      id: "outdoor-air",
      category: "outdoor-air",
      title: "Outdoor ambient air pollution (PM2.5)",
      detail: "No live ambient reading is available for this location yet. Philippine urban/peri-urban PM2.5 is often elevated relative to WHO guidelines and is not captured by PLCO.",
      status: "unknown",
      priority: "moderate",
      recordedSignal: screening.municipality || screening.province
        ? "Location recorded; ambient lookup unavailable"
        : "Location / ambient reading not available",
    };
  })();

  const occupational: LocalClinicalConsideration = (() => {
    if (occupationalHits.length) {
      return {
        id: "occupational",
        category: "occupational",
        title: "Occupational lung exposures",
        detail: "Asbestos, silica, mining, and construction-related dusts/fumes are relevant in Philippine industrial and informal labor and are not PLCO predictors. Consider diesel exhaust / welding fumes in the occupational history interview when relevant.",
        status: "present",
        priority: "high",
        recordedSignal: occupationalHits.join(" · "),
      };
    }
    if (exposures.includes("Unknown")) {
      return {
        id: "occupational",
        category: "occupational",
        title: "Occupational lung exposures",
        detail: "Occupational exposure was marked unknown. Ask about asbestos, silica, diesel exhaust, welding, mining, and construction dust before closing the risk review.",
        status: "unknown",
        priority: "moderate",
        recordedSignal: "Occupational exposure unknown",
      };
    }
    return {
      id: "occupational",
      category: "occupational",
      title: "Occupational lung exposures",
      detail: "No asbestos/silica/mining/construction signals were checked. Still review informal-sector dust and fume exposures when the work history suggests them.",
      status: "absent",
      priority: "context",
      recordedSignal: exposures.filter((item) => !["None reported", "Unknown"].includes(item)).join(" · ") || "None reported",
    };
  })();

  const tbHistory: LocalClinicalConsideration = (() => {
    if (isYes(screening.previousTuberculosis)) {
      return {
        id: "tb-history",
        category: "tb-history",
        title: "Previous tuberculosis / lung scarring",
        detail: "PLCO asks about COPD/emphysema/chronic bronchitis, not prior TB. Prior TB is a locally important confounder for symptoms and imaging interpretation — review separately from the calculator score.",
        status: "present",
        priority: "high",
        recordedSignal: "Previous tuberculosis = Yes",
      };
    }
    if (screening.previousTuberculosis === "Unknown") {
      return {
        id: "tb-history",
        category: "tb-history",
        title: "Previous tuberculosis / lung scarring",
        detail: "TB history is unknown. Clarify prior TB or residual scarring before relying on symptom or imaging interpretation.",
        status: "unknown",
        priority: "moderate",
        recordedSignal: "Previous tuberculosis = Unknown",
      };
    }
    return {
      id: "tb-history",
      category: "tb-history",
      title: "Previous tuberculosis / lung scarring",
      detail: "No prior TB was recorded. Keep TB in the differential when chronic cough, hemoptysis, or abnormal imaging appear in endemic settings.",
      status: screening.previousTuberculosis === "No" ? "absent" : "unknown",
      priority: "context",
      recordedSignal: screening.previousTuberculosis
        ? `Previous tuberculosis = ${screening.previousTuberculosis}`
        : "TB history not recorded",
    };
  })();

  const geneticContext: LocalClinicalConsideration = {
    id: "genetic-context",
    category: "genetic-context",
    title: "EGFR / molecular risk (population context)",
    detail: isNeverSmoker
      ? "Asian never-smoker lung cancers are disproportionately EGFR-mutation-driven. This cannot be inferred from the questionnaire or PLCO score — name it as a known population-level driver you are not modeling here."
      : "EGFR-mutation–driven disease is enriched in East/Southeast Asian never-smoker lung cancer. It is a clinical/epidemiological context factor only — not captured by PLCOm2012noRace or this symptom layer.",
    status: "context",
    priority: isNeverSmoker ? "high" : "context",
    recordedSignal: "Not measurable from screening inputs — population-level note only",
  };

  return [neverSmoker, indoorAir, outdoorAir, occupational, tbHistory, geneticContext];
};

const bandForPercent = (percent: number): Pick<AerisRiskEstimate, "band" | "bandLabel"> => {
  if (percent >= 3.2) return { band: "Elevated", bandLabel: "Elevated 6-year probability (≥ 3.2%)" };
  if (percent >= 1.5) return { band: "Intermediate", bandLabel: "Intermediate 6-year probability (1.5% – 3.1%)" };
  return { band: "Lower", bandLabel: "Lower 6-year probability (< 1.5%)" };
};

const mapScreeningToPlco = (screening: LocalScreeningDraft): PlcoNoRaceEstimate | { applicable: false; reason: string; modelId: "PLCOm2012noRace"; modelVersion: string } => {
  const status = screening.smokingStatus;
  if (status === "Never smoker" || status === "Never smoked") {
    return {
      applicable: false,
      reason: "PLCOm2012noRace is validated for current and former smokers only. Never-smokers are outside this model — review local clinical considerations below.",
      modelId: "PLCOm2012noRace",
      modelVersion: "Ver1-13OCT2016-MT",
    };
  }
  if (status !== "Current smoker" && status !== "Former smoker") {
    return {
      applicable: false,
      reason: "Smoking status must be Current smoker or Former smoker to run PLCOm2012noRace.",
      modelId: "PLCOm2012noRace",
      modelVersion: "Ver1-13OCT2016-MT",
    };
  }

  const ageYears = parseNumber(screening.age);
  const education = parseEducation(screening.educationLevel);
  const heightCm = parseNumber(screening.heightCm);
  const weightKg = parseNumber(screening.weightKg);
  const bmi = heightCm && weightKg ? bmiFromMetric(heightCm, weightKg) : parseNumber(screening.bmi);
  const cigarettesPerDay = parseNumber(screening.cigarettesPerDay);
  const yearsSmoked = parseNumber(screening.yearsSmoked);
  const yearsSinceQuit = status === "Former smoker"
    ? (screening.yearsSinceQuitting === "Not applicable" ? null : parseNumber(screening.yearsSinceQuitting))
    : 0;

  if (ageYears === null) {
    return { applicable: false, reason: "Exact age is required for PLCOm2012noRace.", modelId: "PLCOm2012noRace", modelVersion: "Ver1-13OCT2016-MT" };
  }
  if (education === null) {
    return { applicable: false, reason: "Education level (1–6) is required for PLCOm2012noRace.", modelId: "PLCOm2012noRace", modelVersion: "Ver1-13OCT2016-MT" };
  }
  if (bmi === null) {
    return { applicable: false, reason: "Height and weight (BMI) are required for PLCOm2012noRace.", modelId: "PLCOm2012noRace", modelVersion: "Ver1-13OCT2016-MT" };
  }
  if (cigarettesPerDay === null || yearsSmoked === null) {
    return { applicable: false, reason: "Cigarettes per day and years smoked are required for PLCOm2012noRace.", modelId: "PLCOm2012noRace", modelVersion: "Ver1-13OCT2016-MT" };
  }
  if (status === "Former smoker" && yearsSinceQuit === null) {
    return { applicable: false, reason: "Years since quitting is required for former smokers.", modelId: "PLCOm2012noRace", modelVersion: "Ver1-13OCT2016-MT" };
  }

  return estimatePlcom2012NoRace({
    ageYears,
    education,
    bmi,
    copd: isYes(screening.copd),
    personalHistoryOfCancer: isYes(screening.previousMalignancy),
    familyHistoryOfLungCancer: isYes(screening.familyHistory),
    currentSmoker: status === "Current smoker",
    cigarettesPerDay,
    yearsSmoked,
    yearsSinceQuit: yearsSinceQuit ?? 0,
  });
};

/**
 * Aeris risk support: PLCOm2012noRace probability + separate local clinician considerations.
 * Local factors are never mixed into the PLCO percentage.
 */
export const estimateAerisRisk = (
  screening: LocalScreeningDraft,
  environmental: EnvironmentalRiskSnapshot | null = null,
): AerisRiskEstimate => {
  const plco = mapScreeningToPlco(screening);
  const clinicalFlags = clinicalFlagsFromScreening(screening);
  const localConsiderations = localConsiderationsFromScreening(screening, environmental);
  const ageYears = parseNumber(screening.age);
  const education = parseEducation(screening.educationLevel);
  const heightCm = parseNumber(screening.heightCm);
  const weightKg = parseNumber(screening.weightKg);
  const bmi = heightCm && weightKg ? bmiFromMetric(heightCm, weightKg) : parseNumber(screening.bmi);
  const cigarettesPerDay = parseNumber(screening.cigarettesPerDay);
  const yearsSmoked = parseNumber(screening.yearsSmoked);
  const yearsSinceQuit = screening.smokingStatus === "Former smoker"
    ? parseNumber(screening.yearsSinceQuitting)
    : screening.smokingStatus === "Current smoker" ? 0 : null;
  const packYearsDerived = cigarettesPerDay !== null && yearsSmoked !== null
    ? Math.round((cigarettesPerDay / 20) * yearsSmoked * 10) / 10
    : parseNumber(screening.packYears);

  const methodNote = "Tammemägi PLCOm2012noRace 6-year lung-cancer probability. Coefficients match the non-commercial reference calculator (Ver1-13OCT2016-MT). Race/ethnicity is omitted. Local Philippine/Asian context factors are listed separately and do not change this percentage.";
  const eligibilityNote = "Many screening programs discuss PLCOm2012 thresholds around ≥1.5% or ≥2.0% 6-year risk; local eligibility rules may differ. This demo does not authorize screening.";
  const considerationsNote = "Review the local clinical considerations below with the patient. They cover known PLCOm2012noRace gaps for East/Southeast Asian and Philippine field settings and must not be read as part of the calculator score.";

  const shared = {
    clinicalFlags,
    localConsiderations,
    modelId: "PLCOm2012noRace" as const,
    methodNote,
    eligibilityNote,
    considerationsNote,
    usedEnvironmental: Boolean(environmental && environmental.pm25 !== null),
    usedPublicRegion: false as const,
    inputsSummary: { ageYears, education, bmi, cigarettesPerDay, yearsSmoked, yearsSinceQuit, packYearsDerived },
  };

  if (!plco.applicable) {
    return {
      percent: null,
      probability: null,
      band: "Unavailable",
      bandLabel: "Estimate unavailable",
      applicable: false,
      unavailableReason: plco.reason,
      contributions: [],
      modelVersion: plco.modelVersion,
      ...shared,
    };
  }

  const { band, bandLabel } = bandForPercent(plco.percent);
  return {
    percent: plco.percent,
    probability: plco.probability,
    band,
    bandLabel,
    applicable: true,
    unavailableReason: null,
    contributions: plco.contributions,
    modelVersion: plco.modelVersion,
    ...shared,
    modelId: plco.modelId,
  };
};
