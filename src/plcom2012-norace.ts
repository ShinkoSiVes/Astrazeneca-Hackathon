/**
 * Tammemägi PLCOm2012noRace — 6-year lung-cancer probability.
 *
 * Coefficients and centering values match the non-commercial reference
 * calculator PLCOm2012noRace-13OCT16 (Ver1-13OCT2016-MT / MTed 12AUG2020)
 * under references/risk-calculators/. Race/ethnicity is omitted by design
 * (preferred outside the US / for Hispanic and Asian populations).
 *
 * Model applies to ever-smokers (current or former). Never-smokers are
 * outside the PLCOm2012 family and return applicable=false.
 *
 * Attribution: Martin Tammemägi et al. Non-profit / non-commercial use only
 * per calculator notes; commercial use requires contacting the author.
 */

export type PlcoEducationLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type PlcoNoRaceInputs = {
  ageYears: number;
  education: PlcoEducationLevel;
  bmi: number;
  copd: boolean;
  personalHistoryOfCancer: boolean;
  familyHistoryOfLungCancer: boolean;
  /** true = current smoker; false = former smoker */
  currentSmoker: boolean;
  cigarettesPerDay: number;
  yearsSmoked: number;
  /** 0 for current smokers */
  yearsSinceQuit: number;
};

export type PlcoContribution = {
  id: string;
  label: string;
  inputValue: string;
  centeredOrTransformed: number;
  beta: number;
  contribution: number;
};

export type PlcoNoRaceResult = {
  applicable: true;
  logit: number;
  probability: number;
  percent: number;
  contributions: PlcoContribution[];
  modelId: "PLCOm2012noRace";
  modelVersion: "Ver1-13OCT2016-MT";
};

export type PlcoNoRaceUnavailable = {
  applicable: false;
  reason: string;
  modelId: "PLCOm2012noRace";
  modelVersion: "Ver1-13OCT2016-MT";
};

export type PlcoNoRaceEstimate = PlcoNoRaceResult | PlcoNoRaceUnavailable;

/** Beta / centering constants from the locked Excel reference calculator. */
export const PLCOM2012_NORACE = {
  age: { beta: 0.0778895, center: 62 },
  education: { beta: -0.0811569, center: 4 },
  bmi: { beta: -0.0251066, center: 27 },
  copd: { beta: 0.3606082 },
  personalCancer: { beta: 0.4683545 },
  familyLungCancer: { beta: 0.584541 },
  currentSmoker: { beta: 0.2675539 },
  smokingIntensity: {
    beta: -1.767578,
    transform: (cigarettesPerDay: number) => (cigarettesPerDay / 10) ** -1 - 0.4021541613,
  },
  duration: { beta: 0.031949, center: 27 },
  yearsQuit: { beta: -0.0312719, center: 10 },
  intercept: -4.536696,
} as const;

export const PLCO_EDUCATION_OPTIONS: { value: PlcoEducationLevel; label: string }[] = [
  { value: 1, label: "1 — Less than high school" },
  { value: 2, label: "2 — High school graduate" },
  { value: 3, label: "3 — Post–high school training" },
  { value: 4, label: "4 — Some college" },
  { value: 5, label: "5 — College graduate" },
  { value: 6, label: "6 — Postgraduate / professional" },
];

export const bmiFromMetric = (heightCm: number, weightKg: number) => {
  if (!(heightCm > 0) || !(weightKg > 0)) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
};

export const packYearsFromIntensity = (cigarettesPerDay: number, yearsSmoked: number) => {
  if (!(cigarettesPerDay > 0) || !(yearsSmoked > 0)) return 0;
  return Math.round((cigarettesPerDay / 20) * yearsSmoked * 10) / 10;
};

const round6 = (value: number) => Math.round(value * 1e6) / 1e6;

export const estimatePlcom2012NoRace = (inputs: PlcoNoRaceInputs): PlcoNoRaceEstimate => {
  if (!(inputs.ageYears > 0)) {
    return { applicable: false, reason: "Age is required for PLCOm2012noRace.", modelId: "PLCOm2012noRace", modelVersion: "Ver1-13OCT2016-MT" };
  }
  if (!(inputs.bmi > 0)) {
    return { applicable: false, reason: "BMI (from height and weight) is required for PLCOm2012noRace.", modelId: "PLCOm2012noRace", modelVersion: "Ver1-13OCT2016-MT" };
  }
  if (!(inputs.cigarettesPerDay > 0) || !(inputs.yearsSmoked > 0)) {
    return {
      applicable: false,
      reason: "PLCOm2012noRace requires average cigarettes/day and years smoked for ever-smokers.",
      modelId: "PLCOm2012noRace",
      modelVersion: "Ver1-13OCT2016-MT",
    };
  }

  const yearsSinceQuit = inputs.currentSmoker ? 0 : Math.max(0, inputs.yearsSinceQuit);
  const intensityTransformed = PLCOM2012_NORACE.smokingIntensity.transform(inputs.cigarettesPerDay);

  const contributions: PlcoContribution[] = [
    {
      id: "age",
      label: "Age",
      inputValue: `${inputs.ageYears} years`,
      centeredOrTransformed: inputs.ageYears - PLCOM2012_NORACE.age.center,
      beta: PLCOM2012_NORACE.age.beta,
      contribution: (inputs.ageYears - PLCOM2012_NORACE.age.center) * PLCOM2012_NORACE.age.beta,
    },
    {
      id: "education",
      label: "Education",
      inputValue: `Level ${inputs.education}`,
      centeredOrTransformed: inputs.education - PLCOM2012_NORACE.education.center,
      beta: PLCOM2012_NORACE.education.beta,
      contribution: (inputs.education - PLCOM2012_NORACE.education.center) * PLCOM2012_NORACE.education.beta,
    },
    {
      id: "bmi",
      label: "BMI",
      inputValue: `${inputs.bmi}`,
      centeredOrTransformed: inputs.bmi - PLCOM2012_NORACE.bmi.center,
      beta: PLCOM2012_NORACE.bmi.beta,
      contribution: (inputs.bmi - PLCOM2012_NORACE.bmi.center) * PLCOM2012_NORACE.bmi.beta,
    },
    {
      id: "copd",
      label: "COPD",
      inputValue: inputs.copd ? "Yes" : "No",
      centeredOrTransformed: inputs.copd ? 1 : 0,
      beta: PLCOM2012_NORACE.copd.beta,
      contribution: (inputs.copd ? 1 : 0) * PLCOM2012_NORACE.copd.beta,
    },
    {
      id: "personal-cancer",
      label: "Personal history of cancer",
      inputValue: inputs.personalHistoryOfCancer ? "Yes" : "No",
      centeredOrTransformed: inputs.personalHistoryOfCancer ? 1 : 0,
      beta: PLCOM2012_NORACE.personalCancer.beta,
      contribution: (inputs.personalHistoryOfCancer ? 1 : 0) * PLCOM2012_NORACE.personalCancer.beta,
    },
    {
      id: "family-lung-cancer",
      label: "Family history of lung cancer",
      inputValue: inputs.familyHistoryOfLungCancer ? "Yes" : "No",
      centeredOrTransformed: inputs.familyHistoryOfLungCancer ? 1 : 0,
      beta: PLCOM2012_NORACE.familyLungCancer.beta,
      contribution: (inputs.familyHistoryOfLungCancer ? 1 : 0) * PLCOM2012_NORACE.familyLungCancer.beta,
    },
    {
      id: "smoking-status",
      label: "Smoking status",
      inputValue: inputs.currentSmoker ? "Current smoker" : "Former smoker",
      centeredOrTransformed: inputs.currentSmoker ? 1 : 0,
      beta: PLCOM2012_NORACE.currentSmoker.beta,
      contribution: (inputs.currentSmoker ? 1 : 0) * PLCOM2012_NORACE.currentSmoker.beta,
    },
    {
      id: "smoking-intensity",
      label: "Smoking intensity (cig/day)",
      inputValue: `${inputs.cigarettesPerDay} cig/day`,
      centeredOrTransformed: intensityTransformed,
      beta: PLCOM2012_NORACE.smokingIntensity.beta,
      contribution: intensityTransformed * PLCOM2012_NORACE.smokingIntensity.beta,
    },
    {
      id: "duration",
      label: "Duration smoked",
      inputValue: `${inputs.yearsSmoked} years`,
      centeredOrTransformed: inputs.yearsSmoked - PLCOM2012_NORACE.duration.center,
      beta: PLCOM2012_NORACE.duration.beta,
      contribution: (inputs.yearsSmoked - PLCOM2012_NORACE.duration.center) * PLCOM2012_NORACE.duration.beta,
    },
    {
      id: "years-quit",
      label: "Years since quitting",
      inputValue: inputs.currentSmoker ? "0 (current smoker)" : `${yearsSinceQuit} years`,
      centeredOrTransformed: yearsSinceQuit - PLCOM2012_NORACE.yearsQuit.center,
      beta: PLCOM2012_NORACE.yearsQuit.beta,
      contribution: (yearsSinceQuit - PLCOM2012_NORACE.yearsQuit.center) * PLCOM2012_NORACE.yearsQuit.beta,
    },
    {
      id: "intercept",
      label: "Model constant",
      inputValue: "—",
      centeredOrTransformed: 1,
      beta: PLCOM2012_NORACE.intercept,
      contribution: PLCOM2012_NORACE.intercept,
    },
  ];

  const logit = contributions.reduce((sum, item) => sum + item.contribution, 0);
  const odds = Math.exp(logit);
  const probability = odds / (1 + odds);
  const percent = Math.round(probability * 1000) / 10;

  return {
    applicable: true,
    logit: round6(logit),
    probability: round6(probability),
    percent,
    contributions: contributions.map((item) => ({
      ...item,
      centeredOrTransformed: round6(item.centeredOrTransformed),
      contribution: round6(item.contribution),
    })),
    modelId: "PLCOm2012noRace",
    modelVersion: "Ver1-13OCT2016-MT",
  };
};
