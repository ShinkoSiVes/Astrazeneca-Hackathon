/** Metric storage helpers for screening drafts. PLCOm2012noRace expects heightCm + weightKg → BMI. */

export const CM_PER_INCH = 2.54;
export const LB_PER_KG = 2.2046226218;

export type HeightUnit = "cm" | "ft-in";
export type WeightUnit = "kg" | "lb";
export type TemperatureUnit = "C" | "F";

const round1 = (value: number) => Math.round(value * 10) / 10;

export const parseMeasure = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const cmToFeetInches = (cm: number) => {
  const totalInches = cm / CM_PER_INCH;
  let feet = Math.floor(totalInches / 12);
  let inches = round1(totalInches - feet * 12);
  if (inches >= 12) {
    feet += 1;
    inches = round1(inches - 12);
  }
  return { feet, inches };
};

export const feetInchesToCm = (feet: number, inches: number) => {
  const totalInches = feet * 12 + inches;
  if (!(totalInches > 0)) return null;
  return round1(totalInches * CM_PER_INCH);
};

export const kgToLb = (kg: number) => round1(kg * LB_PER_KG);
export const lbToKg = (lb: number) => round1(lb / LB_PER_KG);

export const celsiusToFahrenheit = (celsius: number) => round1((celsius * 9) / 5 + 32);
export const fahrenheitToCelsius = (fahrenheit: number) => round1(((fahrenheit - 32) * 5) / 9);

export const displayHeightParts = (heightCm: string) => {
  const cm = parseMeasure(heightCm);
  if (cm === null || cm <= 0) return { feet: "", inches: "" };
  const { feet, inches } = cmToFeetInches(cm);
  return {
    feet: String(feet),
    inches: inches === 0 ? "" : String(inches),
  };
};

export const displayWeight = (weightKg: string, unit: WeightUnit) => {
  const kg = parseMeasure(weightKg);
  if (kg === null || kg <= 0) return "";
  return unit === "kg" ? String(kg) : String(kgToLb(kg));
};

export const displayTemperature = (temperatureC: string, unit: TemperatureUnit) => {
  const celsius = parseMeasure(temperatureC);
  if (celsius === null) return "";
  return unit === "C" ? String(celsius) : String(celsiusToFahrenheit(celsius));
};

export const displayWeightLoss = (weightLossAmountKg: string, unit: WeightUnit) => {
  const kg = parseMeasure(weightLossAmountKg);
  if (kg === null || kg < 0) return "";
  return unit === "kg" ? String(kg) : String(kgToLb(kg));
};
