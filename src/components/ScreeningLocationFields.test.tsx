import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScreeningLocationFields } from "./ScreeningLocationFields";

function LocationHarness() {
  const [region, setRegion] = useState("");
  const [locality, setLocality] = useState("");
  return <ScreeningLocationFields region={region} locality={locality} onRegionChange={(next) => { setRegion(next); setLocality(""); }} onLocalityChange={setLocality} />;
}

describe("TASK-008 dependent searchable location selectors", () => {
  it("searches the 18 regions and restricts localities to the selected region", async () => {
    const user = userEvent.setup();
    render(<LocationHarness />);

    const localitySearch = screen.getByRole("combobox", { name: /barangay/i });
    expect(localitySearch).toBeDisabled();

    await user.click(screen.getByRole("combobox", { name: "Region" }));
    await user.type(screen.getByRole("combobox", { name: "Region" }), "ncr");
    await user.click(screen.getByRole("option", { name: "National Capital Region (NCR)" }));

    expect(localitySearch).toBeEnabled();
    await user.click(localitySearch);
    expect(screen.getByRole("option", { name: "Manila" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Vigan City" })).not.toBeInTheDocument();

    await user.type(localitySearch, "mak");
    await user.click(screen.getByRole("option", { name: "Makati City" }));
    expect(localitySearch).toHaveValue("Makati City");
  });
});
