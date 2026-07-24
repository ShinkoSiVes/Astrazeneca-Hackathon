import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScreeningLocationFields } from "./ScreeningLocationFields";
import directory from "../data/psgc-2026-01-13.json";

function LocationHarness() {
  const [region, setRegion] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [barangay, setBarangay] = useState("");
  return <ScreeningLocationFields region={region} municipality={municipality} barangay={barangay} onRegionChange={(next) => { setRegion(next); setMunicipality(""); setBarangay(""); }} onMunicipalityChange={(next) => { setMunicipality(next); setBarangay(""); }} onBarangayChange={setBarangay} />;
}

describe("offline PSGC dependent location selectors", () => {
  it("bundles the full 18-region directory rather than a representative fixture", () => {
    expect(directory.regions).toHaveLength(18);
    expect(directory.regions.flatMap((region) => region.localities)).toHaveLength(1655);
    expect(directory.regions.flatMap((region) => region.localities).flatMap((locality) => locality.barangays)).toHaveLength(42010);
  });

  it("searches all bundled localities and restricts barangays to the selected municipality", async () => {
    const user = userEvent.setup();
    render(<LocationHarness />);

    const municipalitySearch = screen.getByRole("combobox", { name: /city \/ municipality/i });
    const barangaySearch = screen.getByRole("combobox", { name: "Barangay" });
    expect(municipalitySearch).toBeDisabled();
    expect(barangaySearch).toBeDisabled();

    await user.click(screen.getByRole("combobox", { name: "Region" }));
    await user.type(screen.getByRole("combobox", { name: "Region" }), "ncr");
    await user.click(screen.getByRole("option", { name: "National Capital Region (NCR)" }));

    await waitFor(() => expect(municipalitySearch).toBeEnabled());
    await user.click(municipalitySearch);
    await user.type(municipalitySearch, "makati");
    await user.click(screen.getByRole("option", { name: "City of Makati" }));

    expect(barangaySearch).toBeEnabled();
    await user.click(barangaySearch);
    expect(screen.getByRole("option", { name: "Forbes Park" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Vigan" })).not.toBeInTheDocument();

    await user.type(barangaySearch, "pobla");
    await user.click(screen.getByRole("option", { name: "Poblacion" }));
    expect(barangaySearch).toHaveValue("Poblacion");
  });
});
