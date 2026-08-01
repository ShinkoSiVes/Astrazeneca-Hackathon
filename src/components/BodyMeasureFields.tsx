import { useEffect, useState } from "react";
import type { HeightUnit, WeightUnit } from "../body-measures";
import {
  displayHeightParts,
  displayWeight,
  feetInchesToCm,
  lbToKg,
  parseMeasure,
} from "../body-measures";

type BodyMeasureFieldsProps = {
  heightCm: string;
  weightKg: string;
  bmi: string;
  heightInvalid?: boolean;
  weightInvalid?: boolean;
  heightUnit: HeightUnit;
  weightUnit: WeightUnit;
  onHeightUnitChange: (unit: HeightUnit) => void;
  onWeightUnitChange: (unit: WeightUnit) => void;
  onHeightCmChange: (heightCm: string) => void;
  onWeightKgChange: (weightKg: string) => void;
};

export function BodyMeasureFields({
  heightCm,
  weightKg,
  bmi,
  heightInvalid = false,
  weightInvalid = false,
  heightUnit,
  weightUnit,
  onHeightUnitChange,
  onWeightUnitChange,
  onHeightCmChange,
  onWeightKgChange,
}: BodyMeasureFieldsProps) {
  const metricHeightParts = displayHeightParts(heightCm);
  const [feetText, setFeetText] = useState(metricHeightParts.feet);
  const [inchesText, setInchesText] = useState(metricHeightParts.inches);
  const [weightText, setWeightText] = useState(displayWeight(weightKg, weightUnit));

  useEffect(() => {
    if (heightUnit !== "ft-in") return;
    const parts = displayHeightParts(heightCm);
    setFeetText(parts.feet);
    setInchesText(parts.inches);
  }, [heightUnit]);

  useEffect(() => {
    setWeightText(displayWeight(weightKg, weightUnit));
  }, [weightUnit]);

  const commitImperialHeight = (nextFeet: string, nextInches: string) => {
    if (!nextFeet.trim() && !nextInches.trim()) {
      onHeightCmChange("");
      return;
    }
    const feet = parseMeasure(nextFeet) ?? 0;
    const inches = parseMeasure(nextInches) ?? 0;
    const cm = feetInchesToCm(feet, inches);
    onHeightCmChange(cm == null ? "" : String(cm));
  };

  const updateFeet = (value: string) => {
    setFeetText(value);
    commitImperialHeight(value, inchesText);
  };

  const updateInches = (value: string) => {
    setInchesText(value);
    commitImperialHeight(feetText, value);
  };

  const updateWeightDisplay = (value: string) => {
    setWeightText(value);
    if (!value.trim()) {
      onWeightKgChange("");
      return;
    }
    const parsed = parseMeasure(value);
    if (parsed === null) return;
    onWeightKgChange(weightUnit === "kg" ? String(parsed) : String(lbToKg(parsed)));
  };

  const changeWeightUnit = (unit: WeightUnit) => {
    onWeightUnitChange(unit);
    setWeightText(displayWeight(weightKg, unit));
  };

  return (
    <>
      <div className={`measure-field ${heightInvalid ? "is-required-missing" : ""}`}>
        <div className="measure-field-topline">
          <span>Height</span>
          <div className="unit-toggle" role="group" aria-label="Height unit">
            <button type="button" className={heightUnit === "cm" ? "active" : ""} aria-pressed={heightUnit === "cm"} onClick={() => onHeightUnitChange("cm")}>cm</button>
            <button type="button" className={heightUnit === "ft-in" ? "active" : ""} aria-pressed={heightUnit === "ft-in"} onClick={() => onHeightUnitChange("ft-in")}>ft / in</button>
          </div>
        </div>
        {heightUnit === "cm" ? (
          <label className={heightInvalid ? "is-required-missing" : undefined}>
            Height (cm)
            <input
              name="heightCm"
              type="number"
              min="50"
              max="250"
              step="0.1"
              inputMode="decimal"
              value={heightCm}
              onChange={(event) => onHeightCmChange(event.target.value)}
              placeholder="e.g. 165"
            />
          </label>
        ) : (
          <div className="imperial-height-grid">
            <label className={heightInvalid ? "is-required-missing" : undefined}>
              Feet
              <input
                name="heightFeet"
                type="number"
                min="0"
                max="8"
                step="1"
                inputMode="numeric"
                value={feetText}
                onChange={(event) => updateFeet(event.target.value)}
                placeholder="e.g. 5"
              />
            </label>
            <label className={heightInvalid ? "is-required-missing" : undefined}>
              Inches
              <input
                name="heightInches"
                type="number"
                min="0"
                max="11.9"
                step="0.1"
                inputMode="decimal"
                value={inchesText}
                onChange={(event) => updateInches(event.target.value)}
                placeholder="e.g. 5"
              />
            </label>
          </div>
        )}
        {heightUnit === "ft-in" && heightCm && (
          <small className="measure-converted">Stored for calculator: {heightCm} cm</small>
        )}
      </div>

      <div className={`measure-field ${weightInvalid ? "is-required-missing" : ""}`}>
        <div className="measure-field-topline">
          <span>Weight</span>
          <div className="unit-toggle" role="group" aria-label="Weight unit">
            <button type="button" className={weightUnit === "kg" ? "active" : ""} aria-pressed={weightUnit === "kg"} onClick={() => changeWeightUnit("kg")}>kg</button>
            <button type="button" className={weightUnit === "lb" ? "active" : ""} aria-pressed={weightUnit === "lb"} onClick={() => changeWeightUnit("lb")}>lb</button>
          </div>
        </div>
        <label className={weightInvalid ? "is-required-missing" : undefined}>
          Weight ({weightUnit})
          <input
            name="weightKg"
            type="number"
            min={weightUnit === "kg" ? "20" : "44"}
            max={weightUnit === "kg" ? "300" : "660"}
            step="0.1"
            inputMode="decimal"
            value={weightUnit === "kg" ? weightKg : weightText}
            onChange={(event) => {
              if (weightUnit === "kg") {
                onWeightKgChange(event.target.value);
                return;
              }
              updateWeightDisplay(event.target.value);
            }}
            placeholder={weightUnit === "kg" ? "e.g. 70" : "e.g. 154"}
          />
        </label>
        {weightUnit === "lb" && weightKg && (
          <small className="measure-converted">Stored for calculator: {weightKg} kg</small>
        )}
      </div>

      <label>
        BMI (auto)
        <input name="bmi" value={bmi ? `${bmi} kg/m²` : "Enter height and weight"} readOnly />
      </label>
    </>
  );
}
