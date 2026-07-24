import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TobaccoUseAmount } from "./TobaccoUseAmount";

function TobaccoUseHarness() {
  const [frequency, setFrequency] = useState("");
  const [packs, setPacks] = useState("");
  return <TobaccoUseAmount frequency={frequency} packs={packs} onFrequencyChange={setFrequency} onPacksChange={setPacks} />;
}

describe("TobaccoUseAmount", () => {
  it("requires a frequency before the estimated pack amount and reads them as one value", async () => {
    const user = userEvent.setup();
    render(<TobaccoUseHarness />);

    const packs = screen.getByRole("textbox", { name: "Estimated packs" });
    expect(packs).toBeDisabled();

    await user.selectOptions(screen.getByRole("combobox", { name: "Tobacco-use frequency" }), "Per day");
    expect(packs).toBeEnabled();
    await user.type(packs, "1.5");

    expect(screen.getByText("1.5 packs per day.")).toBeInTheDocument();
  });

  it("records no tobacco use without requiring an estimated pack amount", async () => {
    const user = userEvent.setup();
    render(<TobaccoUseHarness />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Tobacco-use frequency" }), "Not a smoker");

    expect(screen.getByRole("textbox", { name: "Estimated packs" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Estimated packs" })).toHaveValue("0");
    expect(screen.getByText("No tobacco use reported.")).toBeInTheDocument();
  });
});
