import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { EncounterDashboard } from "./EncounterDashboard";
import { screeningHistoryKey, temporaryRecordKey, type LocalScreeningDraft } from "../local-screenings";

const draft: LocalScreeningDraft = {
  fieldReference: "FIELD-2026-014", ageRange: "50-59", sexAtBirth: "Female", barangay: "Banaue", municipality: "Banaue — Ifugao", province: "Cordillera Administrative Region (CAR)", smokingStatus: "Former smoker", packFrequency: "Per day", packYears: "12", householdSmoke: "No", occupationalExposure: "None reported", lungHistory: "None reported", familyHistory: "No", persistentCough: "No", breathlessness: "No", bloodInSputum: "No", weightLoss: "No", weightLossAmount: "", oxygenSaturation: "97", clinicianNotes: "Demo entry",
};

const renderDashboard = () => {
  const props = {
    clinicianId: "BHW-024",
    onStartScreening: vi.fn(),
    onEditScreening: vi.fn(),
    onDeleteScreening: vi.fn(),
    onViewTemporaryRecord: vi.fn(),
    onEndSession: vi.fn(),
  };
  render(<EncounterDashboard {...props} />);
  return props;
};

describe("TASK-007 clinician encounter dashboard", () => {
  beforeEach(() => localStorage.clear());

  it("starts a new screening and keeps the temporary-record action unavailable when none is saved", async () => {
    const user = userEvent.setup();
    const props = renderDashboard();

    await user.click(screen.getByRole("button", { name: /new screening/i }));
    expect(props.onStartScreening).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: /open temporary record/i })).toBeDisabled();
  });

  it("lists a saved screening and reopens it for clinician editing", async () => {
    localStorage.setItem(screeningHistoryKey, JSON.stringify([{ id: draft.fieldReference, savedAt: "2026-07-24T09:30:00.000Z", data: draft }]));
    const user = userEvent.setup();
    const props = renderDashboard();

    expect(screen.getByText(draft.fieldReference)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /edit screening/i }));
    expect(props.onEditScreening).toHaveBeenCalledWith(draft);
  });

  it("deletes only the selected previous screening after confirmation", async () => {
    const secondDraft = { ...draft, fieldReference: "FIELD-2026-015" };
    localStorage.setItem(screeningHistoryKey, JSON.stringify([
      { id: draft.fieldReference, savedAt: "2026-07-24T09:30:00.000Z", data: draft },
      { id: secondDraft.fieldReference, savedAt: "2026-07-24T09:20:00.000Z", data: secondDraft },
    ]));
    const user = userEvent.setup();
    const props = renderDashboard();

    await user.click(screen.getAllByRole("button", { name: /delete local copy/i })[0]);
    expect(screen.getByRole("dialog", { name: /delete this previous screening/i })).toBeInTheDocument();
    expect(props.onDeleteScreening).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /delete screening/i }));
    expect(props.onDeleteScreening).toHaveBeenCalledWith(draft.fieldReference);
    expect(screen.queryByText(draft.fieldReference)).not.toBeInTheDocument();
    expect(screen.getByText(secondDraft.fieldReference)).toBeInTheDocument();
  });

  it("opens the saved temporary data only when a local temporary record exists", async () => {
    localStorage.setItem(temporaryRecordKey, JSON.stringify({ savedAt: "2026-07-24T09:30:00.000Z", status: "awaiting additional imaging details", screening: draft }));
    const user = userEvent.setup();
    const props = renderDashboard();

    const temporaryButton = screen.getByRole("button", { name: /open temporary record/i });
    expect(temporaryButton).toBeEnabled();
    await user.click(temporaryButton);
    expect(props.onViewTemporaryRecord).toHaveBeenCalledOnce();
  });
});
