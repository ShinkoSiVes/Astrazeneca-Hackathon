import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { PhilippinesRegionMap } from "./PhilippinesRegionMap";

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
