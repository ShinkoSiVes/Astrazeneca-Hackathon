import { describe, expect, it } from "vitest";
import {
  celsiusToFahrenheit,
  cmToFeetInches,
  displayHeightParts,
  displayTemperature,
  displayWeight,
  fahrenheitToCelsius,
  feetInchesToCm,
  kgToLb,
  lbToKg,
} from "./body-measures";

describe("body measure conversions", () => {
  it("converts centimeters to feet and inches and back", () => {
    expect(cmToFeetInches(165.1)).toEqual({ feet: 5, inches: 5 });
    expect(feetInchesToCm(5, 5)).toBe(165.1);
    expect(displayHeightParts("170")).toEqual({ feet: "5", inches: "6.9" });
  });

  it("converts kilograms and pounds both ways", () => {
    expect(kgToLb(70)).toBe(154.3);
    expect(lbToKg(154.3)).toBe(70);
    expect(displayWeight("70", "lb")).toBe("154.3");
    expect(displayWeight("70", "kg")).toBe("70");
  });

  it("converts Celsius and Fahrenheit both ways", () => {
    expect(celsiusToFahrenheit(36.8)).toBe(98.2);
    expect(fahrenheitToCelsius(98.2)).toBe(36.8);
    expect(displayTemperature("36.8", "F")).toBe("98.2");
  });
});
