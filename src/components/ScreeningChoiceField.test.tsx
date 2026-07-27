import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { ScreeningInputEvidenceItem } from "../local-screenings";
import { ScreeningChoiceField } from "./ScreeningChoiceField";

const emptyEvidence: ScreeningInputEvidenceItem = {
  rawText: "",
  suggestedValue: "",
  confirmedValue: "",
};

function TextChoiceHarness() {
  const [value, setValue] = useState("");
  const [evidence, setEvidence] = useState(emptyEvidence);
  return (
    <ScreeningChoiceField
      field="smokingStatus"
      label="Smoking status"
      value={value}
      options={["Current smoker", "Former smoker", "Never smoker"]}
      mode="text"
      evidence={evidence}
      onChange={setValue}
      onEvidenceChange={setEvidence}
    />
  );
}

describe("ScreeningChoiceField", () => {
  it("requires confirmation before committing interpreted text", async () => {
    const user = userEvent.setup();
    render(<TextChoiceHarness />);

    await user.type(screen.getByLabelText(/smoking status/i), "used to smoke");
    expect(screen.getByText(/closest local match/i)).toHaveTextContent("Former smoker");
    expect(screen.getByLabelText(/smoking status/i)).toHaveAttribute("aria-invalid", "true");

    await user.click(screen.getByRole("button", { name: /confirm former smoker/i }));
    expect(screen.getByText(/confirmed as/i)).toHaveTextContent("Former smoker");
    expect(screen.getByLabelText(/smoking status/i)).toHaveAttribute("aria-invalid", "false");
  });

  it("keeps the existing select behavior in structured mode", async () => {
    const user = userEvent.setup();
    function StructuredHarness() {
      const [value, setValue] = useState("");
      return (
        <ScreeningChoiceField
          field="sexAtBirth"
          label="Sex at birth"
          value={value}
          options={["Female", "Male"]}
          mode="structured"
          onChange={setValue}
          onEvidenceChange={() => undefined}
        />
      );
    }

    render(<StructuredHarness />);
    await user.selectOptions(screen.getByLabelText(/sex at birth/i), "Female");
    expect(screen.getByLabelText(/sex at birth/i)).toHaveValue("Female");
  });
});
