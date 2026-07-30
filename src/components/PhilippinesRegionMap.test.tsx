import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { PhilippinesRegionMap } from "./PhilippinesRegionMap";
import { syntheticRegions } from "../population-dashboard";

const regions = Array.from({ length: 18 }, (_, index) => ({
  id: `region-${index + 1}`,
  label: `Region ${String(index + 1).padStart(2, "0")}`,
  signalLevel: ["Lower", "Moderate", "Higher"][index % 3],
}));

it("exposes 18 clickable, keyboard-selectable regional boundaries", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<PhilippinesRegionMap regions={regions} selectedRegionId="region-1" onSelect={onSelect} />);

  const region = screen.getByRole("button", { name: /region 04, lower static public baseline/i });
  region.focus();
  await user.keyboard("{Enter}");

  expect(screen.getAllByRole("button", { name: /region \d+.*static public baseline/i })).toHaveLength(18);
  expect(onSelect).toHaveBeenCalledWith("region-4");
});

it("includes a full compass rose for map orientation", () => {
  render(<PhilippinesRegionMap regions={regions} selectedRegionId="region-1" onSelect={vi.fn()} />);

  expect(screen.getByLabelText(/compass showing north, east, south, and west/i)).toBeInTheDocument();
});

it("exposes separate public and screening values in combined mode", () => {
  const screeningRegions = regions.map((region, index) => ({
    ...region,
    signalLevel: index === 3 ? "Moderate" : "Lower",
    syntheticRecords: index === 3 ? 2 : 0,
  }));

  render(<PhilippinesRegionMap regions={regions} screeningRegions={screeningRegions} selectedRegionId="region-1" onSelect={vi.fn()} dataSource="combined" />);

  expect(screen.getByRole("button", { name: /region 04, lower static public baseline, 2 unique app screening profiles/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/static public signal and app-screening overlay keys/i)).toBeInTheDocument();
});

it("renders MIMAROPA provinces with local screening signals and returns on Escape", async () => {
  const user = userEvent.setup();
  const onResetView = vi.fn();
  render(
    <PhilippinesRegionMap
      regions={syntheticRegions}
      selectedRegionId="mimaropa"
      zoomReadyRegionId="mimaropa"
      drilledRegionId="mimaropa"
      viewLevel="province"
      dataSource="app-screenings"
      provinceScreeningSignals={[
        { provinceName: "Palawan", screenedIndividuals: 3 },
        { provinceName: "Marinduque", screenedIndividuals: 1 },
      ]}
      onSelect={vi.fn()}
      onResetView={onResetView}
    />,
  );

  expect(screen.getByRole("heading", { name: /mimaropa region/i })).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: /unique app screening profiles/i })).toHaveLength(5);
  expect(screen.getByRole("button", { name: /palawan, 3 unique app screening profiles/i })).toHaveClass("signal-higher");
  expect(screen.getByRole("button", { name: /marinduque, 1 unique app screening profile/i })).toHaveClass("signal-moderate");

  await user.keyboard("{Escape}");
  expect(onResetView).toHaveBeenCalledOnce();
});

it("uses the bundled district and NIR province boundaries in drill-down", () => {
  const { rerender } = render(
    <PhilippinesRegionMap
      regions={syntheticRegions}
      selectedRegionId="ncr"
      drilledRegionId="ncr"
      viewLevel="province"
      onSelect={vi.fn()}
      onResetView={vi.fn()}
    />,
  );

  expect(screen.getByText("4 districts")).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: /province-level public data unavailable/i })).toHaveLength(4);

  rerender(
    <PhilippinesRegionMap
      regions={syntheticRegions}
      selectedRegionId="nir"
      drilledRegionId="nir"
      viewLevel="province"
      onSelect={vi.fn()}
      onResetView={vi.fn()}
    />,
  );

  expect(screen.getByText("3 provinces")).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: /province-level public data unavailable/i })).toHaveLength(3);
});
