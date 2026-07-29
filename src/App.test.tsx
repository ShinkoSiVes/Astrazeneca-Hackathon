import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import App from "./App";
import { screeningHistoryKey } from "./local-screenings";

describe("TASK-001 consent and demo login", () => {
  it("keeps navigation active on page changes and tucks it away only while scrolling down", async () => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    const { container } = render(<App />);
    const navigation = container.querySelector("header");

    expect(navigation).toHaveClass("is-visible");
    Object.defineProperty(window, "scrollY", { configurable: true, value: 120 });
    fireEvent.scroll(window);
    expect(navigation).not.toHaveClass("is-visible");

    Object.defineProperty(window, "scrollY", { configurable: true, value: 80 });
    fireEvent.scroll(window);
    expect(navigation).toHaveClass("is-visible");

    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    fireEvent.scroll(window);
    await userEvent.setup().click(screen.getByRole("button", { name: /about/i }));
    await screen.findByText(/people behind the prototype/i);
    expect(navigation).toHaveClass("is-visible");
  });

  it("starts the FAQ with every answer collapsed", () => {
    const { container } = render(<App />);

    expect(container.querySelectorAll("details[open]")).toHaveLength(0);
  });

  it("requires consent and a passcode before entering the workspace", async () => {
    const user = userEvent.setup();
    render(<App />);

    const continueButton = screen.getByRole("button", { name: /continue to secure login/i });
    expect(continueButton).toBeDisabled();
    await user.click(screen.getByRole("checkbox"));
    await user.click(continueButton);

    const enterButton = await screen.findByRole("button", { name: /enter screening workspace/i });
    expect(enterButton).toBeDisabled();
    const healthCenterMode = screen.getByRole("button", { name: /health care center mode/i });
    const cancerRegistryMode = screen.getByRole("button", { name: /cancer registry mode/i });
    const professionalId = screen.getByLabelText(/health professional id/i);
    expect(healthCenterMode).toHaveAttribute("aria-pressed", "true");
    expect(cancerRegistryMode).toHaveAttribute("aria-pressed", "false");
    expect(professionalId).toHaveValue("HCC-024");
    await user.clear(professionalId);
    await user.type(professionalId, "HCC-731");
    await user.click(cancerRegistryMode);
    expect(healthCenterMode).toHaveAttribute("aria-pressed", "false");
    expect(cancerRegistryMode).toHaveAttribute("aria-pressed", "true");
    expect(professionalId).toHaveValue("CR-731");
    await user.click(healthCenterMode);
    expect(professionalId).toHaveValue("HCC-731");
    await user.click(cancerRegistryMode);
    expect(professionalId).toHaveValue("CR-731");
    await user.type(screen.getByLabelText(/demo passcode/i), "1234");
    await user.click(enterButton);

    await screen.findByText(/consent is recorded for this encounter/i);

    expect(screen.getByRole("heading", { name: /health professional.*cr-731/i })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveClass("view-ready");
    expect(sessionStorage.getItem("idea-demo-clinician")).toBe("CR-731");
  });

  it("opens the static About view and returns to the consent screen", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /about/i }));

    await screen.findByText(/people behind the prototype/i);

    expect(screen.getByRole("heading", { name: /field-friendly path/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^features$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^future features$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /risk estimate credit/i })).toBeInTheDocument();
    expect(screen.getAllByText(/PLCOm2012noRace/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/local imaging metadata workflow/i)).toBeInTheDocument();
    expect(screen.getByText(/aeris custom risk-estimation calculator/i)).toBeInTheDocument();
    expect(screen.getByText(/people behind the prototype/i)).toBeInTheDocument();
    expect(screen.getAllByText("[Name]")).toHaveLength(4);

    await user.click(screen.getByRole("button", { name: /back to screening/i }));
    await screen.findByText(/start every screening with a clear patient choice/i);
    expect(screen.getByRole("heading", { name: /would the patient like to participate/i })).toBeInTheDocument();
  });

  it("returns to the front page from the Aeris AI wordmark", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /about/i }));
    await screen.findByText(/people behind the prototype/i);
    await user.click(screen.getByRole("link", { name: /aeris ai home/i }));

    await screen.findByText(/start every screening with a clear patient choice/i);

    expect(screen.getByRole("heading", { name: /would the patient like to participate/i })).toBeInTheDocument();
  });

  it("shows an 18-region dashboard with a separate static public-data mode", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /heatmap status/i }));

    await screen.findByText(/static public data only/i);

    expect(screen.getByRole("heading", { name: /regional follow-up dashboard/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /static public baseline/i })).toHaveLength(18);
    await user.click(screen.getByRole("button", { name: /region iii.*central luzon.*static public baseline/i }));
    expect(screen.getByRole("heading", { name: /region iii.*central luzon/i })).toBeInTheDocument();
    expect(screen.getByText(/sharing remains disabled/i)).toBeInTheDocument();
  });

  it("counts saved profiling drafts by selected region without combining public data", async () => {
    localStorage.setItem(screeningHistoryKey, JSON.stringify([{
      id: "FIELD-001",
      savedAt: "2026-07-24T09:30:00.000Z",
      data: { fieldReference: "FIELD-001", province: "Region III — Central Luzon", previousSurveyResponse: "No" },
    }]));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /heatmap status/i }));
    await screen.findByText(/static public data only/i);
    await user.click(screen.getByRole("button", { name: /app screenings/i }));

    expect(screen.getByText(/1 heatmap-eligible profile/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /region iii.*central luzon.*moderate app screening profile count/i }));
    expect(screen.getByText(/1 app-screened/i)).toBeInTheDocument();
    expect(screen.getByText(/public data excluded/i)).toBeInTheDocument();
  });

  it("layers public and deduplicated screening data without summing source counts", async () => {
    localStorage.setItem(screeningHistoryKey, JSON.stringify([
      {
        id: "FIELD-001",
        savedAt: "2026-07-24T09:30:00.000Z",
        data: { fieldReference: "FIELD-001", province: "Region III — Central Luzon", previousSurveyResponse: "No" },
      },
      {
        id: "field-001",
        savedAt: "2026-07-24T09:31:00.000Z",
        data: { fieldReference: "field-001", province: "Region III — Central Luzon", previousSurveyResponse: "No" },
      },
    ]));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /heatmap status/i }));
    await user.click(await screen.findByRole("button", { name: /combined overlay/i }));

    expect(screen.getByText(/sources layered, never summed/i)).toBeInTheDocument();
    expect(screen.getByText(/1 duplicate excluded/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /region i.*ilocos region.*0 unique app screening profiles/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /region ii.*cagayan valley.*0 unique app screening profiles/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /region iii.*central luzon.*static public baseline.*1 unique app screening profile/i }));
    expect(screen.getByText("50 baseline")).toBeInTheDocument();
    expect(screen.getByText("1 unique app-screened")).toBeInTheDocument();
    expect(screen.getByText(/layered, not summed/i)).toBeInTheDocument();
  });

  it("saves a clinician screening draft locally", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /continue to secure login/i }));
    await screen.findByLabelText(/demo passcode/i);
    await user.type(screen.getByLabelText(/demo passcode/i), "1234");
    await user.click(screen.getByRole("button", { name: /enter screening workspace/i }));
    await screen.findByRole("button", { name: /start screening/i });
    await user.click(screen.getByRole("button", { name: /start screening/i }));
    await screen.findByLabelText(/field reference/i);
    await user.type(screen.getByLabelText(/field reference/i), "BHW-024-001");
    await user.click(screen.getByRole("button", { name: /save local draft/i }));

    expect(screen.getByText(/screening draft saved on this device/i)).toBeInTheDocument();
    expect(localStorage.getItem("aeris-screening-draft-v1")).toContain("BHW-024-001");
  });

  it("confirms locally interpreted dropdown text and retains the original wording", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /continue to secure login/i }));
    await user.type(await screen.findByLabelText(/demo passcode/i), "1234");
    await user.click(screen.getByRole("button", { name: /enter screening workspace/i }));
    await user.click(await screen.findByRole("button", { name: /new screening/i }));

    await user.click(await screen.findByRole("switch", { name: /text interpretation/i }));
    await user.type(screen.getByLabelText(/sex at birth/i), "woman");
    expect(screen.getByText(/closest local match/i)).toHaveTextContent("Female");
    await user.click(screen.getByRole("button", { name: /confirm female/i }));
    await user.click(screen.getByRole("button", { name: /save local draft/i }));

    const saved = JSON.parse(localStorage.getItem("aeris-screening-draft-v1") ?? "{}") as {
      data?: { sexAtBirth?: string };
      inputMode?: string;
      inputEvidence?: { sexAtBirth?: { rawText?: string; confirmedValue?: string } };
    };
    expect(saved.data?.sexAtBirth).toBe("Female");
    expect(saved.inputMode).toBe("text");
    expect(saved.inputEvidence?.sexAtBirth).toEqual(expect.objectContaining({
      rawText: "woman",
      confirmedValue: "Female",
    }));

    await user.click(screen.getByRole("switch", { name: /text interpretation/i }));
    await user.selectOptions(screen.getByLabelText(/sex at birth/i), "Male");
    await user.click(screen.getByRole("button", { name: /restore local draft/i }));
    expect(screen.getByRole("switch", { name: /text interpretation/i })).toBeChecked();
    expect(screen.getByLabelText(/sex at birth/i)).toHaveValue("woman");
    expect(screen.getByText(/confirmed as/i)).toHaveTextContent("Female");
  });

  it("captures the expanded screening-profile variables", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /continue to secure login/i }));
    await user.type(await screen.findByLabelText(/demo passcode/i), "1234");
    await user.click(screen.getByRole("button", { name: /enter screening workspace/i }));
    await user.click(await screen.findByRole("button", { name: /new screening/i }));

    expect(await screen.findByLabelText(/^age$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/occupation/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    expect(await screen.findByLabelText(/persistent cough/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/chest pain/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hoarseness/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fatigue/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/chest x-ray available/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /digital clubbing/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    expect(await screen.findByLabelText(/average cigarettes per day/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/years smoked/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/years since quitting/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/previous case of tuberculosis/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/previous case of malignancy/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /asbestos/i })).toBeInTheDocument();
  });

  it("records cigarettes-per-day, years smoked, and conditional years-since-quitting", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /continue to secure login/i }));
    await screen.findByLabelText(/demo passcode/i);
    await user.type(screen.getByLabelText(/demo passcode/i), "1234");
    await user.click(screen.getByRole("button", { name: /enter screening workspace/i }));
    await screen.findByRole("button", { name: /new screening/i });
    await user.click(screen.getByRole("button", { name: /new screening/i }));
    await screen.findByRole("button", { name: /^continue$/i });
    await user.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(document.querySelector(".screening-step-panel")).toHaveClass("is-leaving");
    expect(document.querySelector(".screening-card")).toHaveClass("is-switching");
    await screen.findByRole("heading", { name: /symptoms and clinical assessment/i });
    await user.click(screen.getByRole("button", { name: /^continue$/i }));
    await screen.findByRole("heading", { name: /smoking, exposure, and medical history/i });
    await user.selectOptions(await screen.findByLabelText(/smoking status/i), "Former smoker");
    await user.type(screen.getByLabelText(/average cigarettes per day/i), "10");
    await user.type(screen.getByLabelText(/years smoked/i), "24");
    await user.type(screen.getByLabelText(/years since quitting/i), "3");
    await user.click(screen.getByRole("button", { name: /save local draft/i }));

    expect(localStorage.getItem("aeris-screening-draft-v1")).toContain("cigarettesPerDay\":\"10");
    expect(localStorage.getItem("aeris-screening-draft-v1")).toContain("yearsSmoked\":\"24");
    expect(localStorage.getItem("aeris-screening-draft-v1")).toContain("packYears\":\"12");
    expect(localStorage.getItem("aeris-screening-draft-v1")).toContain("yearsSinceQuitting\":\"3");
  });

  it("shows an optional weight-loss amount only after a positive symptom response", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /continue to secure login/i }));
    await user.type(await screen.findByLabelText(/demo passcode/i), "1234");
    await user.click(screen.getByRole("button", { name: /enter screening workspace/i }));
    await user.click(await screen.findByRole("button", { name: /new screening/i }));
    await user.click(await screen.findByRole("button", { name: /^continue$/i }));
    await screen.findByRole("heading", { name: /symptoms and clinical assessment/i });

    expect(screen.queryByLabelText(/how much weight did the patient lose/i)).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/^weight loss$/i), "Yes");
    expect(screen.getByLabelText(/how much weight did the patient lose/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/how much weight did the patient lose/i), "5 kg");
    expect(screen.getByLabelText(/how much weight did the patient lose/i)).toHaveValue("5 kg");
  });

  it("records prior-survey history in the final profiling step", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /continue to secure login/i }));
    await user.type(await screen.findByLabelText(/demo passcode/i), "1234");
    await user.click(screen.getByRole("button", { name: /enter screening workspace/i }));
    await user.click(await screen.findByRole("button", { name: /new screening/i }));
    await user.click(await screen.findByRole("button", { name: /^continue$/i }));
    await screen.findByRole("heading", { name: /symptoms and clinical assessment/i });
    await user.click(screen.getByRole("button", { name: /^continue$/i }));
    await screen.findByRole("heading", { name: /smoking, exposure, and medical history/i });
    await user.click(screen.getByRole("button", { name: /^continue$/i }));
    await screen.findByRole("heading", { name: /previous survey history/i });

    await user.selectOptions(screen.getByLabelText(/has the patient answered any screening surveys/i), "Yes");
    expect(screen.getByText(/excluded from the app-screenings heat map/i)).toBeInTheDocument();
  });

  it.skip("keeps the screening-only path local when AI consent is declined (imaging path archived)", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /continue to secure login/i }));
    await user.type(await screen.findByLabelText(/demo passcode/i), "1234");
    await user.click(screen.getByRole("button", { name: /enter screening workspace/i }));
    await user.click(await screen.findByRole("button", { name: /start screening/i }));
    await user.click(await screen.findByRole("button", { name: /^continue$/i }));
    await screen.findByRole("heading", { name: /smoking, exposure, and medical history/i });
    await user.click(await screen.findByRole("button", { name: /^continue$/i }));
    await screen.findByRole("heading", { name: /symptoms and clinical assessment/i });
    await user.click(await screen.findByRole("button", { name: /finish screening draft/i }));
    await user.click(await screen.findByRole("button", { name: /no, keep screening only/i }));

    expect(await screen.findByRole("heading", { name: /saved without ai support/i })).toBeInTheDocument();
    expect(localStorage.getItem("aeris-screening-only-status-v1")).toContain("aiConsent\":false");
    expect(localStorage.getItem("aeris-temporary-ai-record-v1")).toBeNull();
  });

  it.skip("stores incomplete imaging details as a temporary local record (imaging path archived)", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /continue to secure login/i }));
    await user.type(await screen.findByLabelText(/demo passcode/i), "1234");
    await user.click(screen.getByRole("button", { name: /enter screening workspace/i }));
    await user.click(await screen.findByRole("button", { name: /start screening/i }));
    await user.click(await screen.findByRole("button", { name: /^continue$/i }));
    await screen.findByRole("heading", { name: /smoking, exposure, and medical history/i });
    await user.click(await screen.findByRole("button", { name: /^continue$/i }));
    await screen.findByRole("heading", { name: /symptoms and clinical assessment/i });
    await user.click(await screen.findByRole("button", { name: /finish screening draft/i }));
    await user.click(await screen.findByRole("button", { name: /yes, continue to imaging details/i }));
    const imagingFile = new File(["demo dicom fixture"], "field-ct.dcm", { type: "application/dicom" });
    const chestXray = new File(["demo xray fixture"], "field-cxr.png", { type: "image/png" });
    await user.upload(await screen.findByLabelText(/imaging files/i), [imagingFile, chestXray]);
    expect(screen.getByText("field-ct.dcm")).toBeInTheDocument();
    expect(screen.getByText("field-cxr.png")).toBeInTheDocument();
    await user.type(screen.getByLabelText(/acquisition date for field-ct.dcm/i), "2025-01-15");
    await user.click(await screen.findByRole("button", { name: /select study date/i }));
    await user.selectOptions(screen.getByLabelText(/study month/i), "0");
    await user.click(screen.getByRole("button", { name: /choose january 15/i }));
    expect(screen.getByRole("button", { name: /selected study date: jan 15/i })).toBeInTheDocument();
    await user.selectOptions(await screen.findByLabelText(/imaging modality/i), "No imaging available");
    await user.click(screen.getByRole("button", { name: /save temporary local record/i }));

    expect(await screen.findByRole("heading", { name: /more imaging details are needed/i })).toBeInTheDocument();
    expect(localStorage.getItem("aeris-temporary-ai-record-v1")).toContain("awaiting additional imaging details");
    expect(localStorage.getItem("aeris-temporary-ai-record-v1")).toContain("field-ct.dcm");
    expect(localStorage.getItem("aeris-temporary-ai-record-v1")).toContain("field-cxr.png");
    expect(localStorage.getItem("aeris-temporary-ai-record-v1")).toContain("2025-01-15");
  }, 10_000);

  it.skip("records clinician nodule-review branches locally without presenting a diagnosis (imaging path archived)", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /continue to secure login/i }));
    await user.type(await screen.findByLabelText(/demo passcode/i), "1234");
    await user.click(screen.getByRole("button", { name: /enter screening workspace/i }));
    await user.click(await screen.findByRole("button", { name: /start screening/i }));
    await user.click(await screen.findByRole("button", { name: /^continue$/i }));
    await screen.findByRole("heading", { name: /smoking, exposure, and medical history/i });
    await user.click(await screen.findByRole("button", { name: /^continue$/i }));
    await screen.findByRole("heading", { name: /symptoms and clinical assessment/i });
    await user.click(await screen.findByRole("button", { name: /finish screening draft/i }));
    await user.click(await screen.findByRole("button", { name: /yes, continue to imaging details/i }));
    await user.selectOptions(await screen.findByLabelText(/imaging modality/i), "CT scan");
    await user.selectOptions(screen.getByLabelText(/imaging availability/i), "Available locally");
    await user.type(screen.getByLabelText(/study \/ facility reference/i), "CT-LOCAL-024");
    await user.click(screen.getByRole("button", { name: /save temporary local record/i }));
    await user.click(await screen.findByRole("button", { name: /open clinician review/i }));
    await user.click(await screen.findByRole("button", { name: /request more information/i }));
    expect(await screen.findByText(/more information requested/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /force continue with caveat/i }));

    expect(await screen.findByText(/forced continuation recorded/i)).toBeInTheDocument();
    expect(localStorage.getItem("aeris-clinician-nodule-review-v1")).toContain("forced");
    expect(screen.getByText(/not a nodule finding, malignancy estimate, or diagnosis/i)).toBeInTheDocument();
  }, 10_000);

  it.skip("creates a de-identified local population record only after clinician acceptance (imaging path archived)", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /continue to secure login/i }));
    await user.type(await screen.findByLabelText(/demo passcode/i), "1234");
    await user.click(screen.getByRole("button", { name: /enter screening workspace/i }));
    await user.click(await screen.findByRole("button", { name: /start screening/i }));
    await screen.findByRole("heading", { name: /patient profile and place/i });
    await user.type(screen.getByLabelText(/field reference/i), "PRIVATE-024");
    await user.type(screen.getByLabelText(/province \/ region/i), "Benguet");
    await user.click(await screen.findByRole("button", { name: /^continue$/i }));
    await screen.findByRole("heading", { name: /smoking, exposure, and medical history/i });
    await user.click(await screen.findByRole("button", { name: /^continue$/i }));
    await screen.findByRole("heading", { name: /symptoms and clinical assessment/i });
    await user.click(await screen.findByRole("button", { name: /finish screening draft/i }));
    await user.click(await screen.findByRole("button", { name: /yes, continue to imaging details/i }));
    await user.selectOptions(await screen.findByLabelText(/imaging modality/i), "CT scan");
    await user.selectOptions(screen.getByLabelText(/imaging availability/i), "Available locally");
    await user.type(screen.getByLabelText(/study \/ facility reference/i), "CT-LOCAL-025");
    await user.click(screen.getByRole("button", { name: /save temporary local record/i }));
    await user.click(await screen.findByRole("button", { name: /open clinician review/i }));
    await user.click(await screen.findByRole("button", { name: /accept as reviewed workflow data/i }));
    await user.click(await screen.findByRole("button", { name: /prepare de-identified population record/i }));

    expect(await screen.findByRole("heading", { name: /prepare a population record/i })).toBeInTheDocument();
    expect(screen.getByText(/field reference, barangay, clinician notes/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /create local population record/i }));

    const populationData = localStorage.getItem("aeris-population-data-v1") || "";
    expect(await screen.findByText(/local population record created/i)).toBeInTheDocument();
    expect(populationData).toContain("Province-level: Benguet");
    expect(populationData).not.toContain("PRIVATE-024");
    expect(populationData).not.toContain("CT-LOCAL-025");
  }, 12_000);

  it("rotates through the public landscape scenes", () => {
    vi.useFakeTimers();
    const { container } = render(<App />);

    expect(container.querySelector(".landscape-sagada")).toHaveClass("is-active");

    act(() => {
      vi.advanceTimersByTime(7200);
    });

    expect(container.querySelector(".landscape-mountain-province")).toHaveClass("is-active");
    vi.useRealTimers();
  });
});
