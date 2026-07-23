import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import App from "./App";

describe("TASK-001 consent and demo login", () => {
  it("ends a declined encounter without creating a screening record", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /no, end encounter/i }));

    expect(screen.getByText(/encounter ended/i)).toBeInTheDocument();
    expect(screen.getByText(/no screening record was created/i)).toBeInTheDocument();
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
    await user.type(screen.getByLabelText(/demo passcode/i), "1234");
    await user.click(enterButton);

    await screen.findByText(/consent is recorded for this encounter/i);

    expect(screen.getByRole("heading", { name: /you’re signed in as bhw-024/i })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveClass("view-ready");
    expect(sessionStorage.getItem("idea-demo-clinician")).toBe("BHW-024");
  });

  it("opens the static About view and returns to the consent screen", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /about/i }));

    await screen.findByText(/people behind the prototype/i);

    expect(screen.getByRole("heading", { name: /field-friendly path/i })).toBeInTheDocument();
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

  it("shows the heatmap status without presenting live data", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /heatmap status/i }));

    await screen.findByText(/no real patient records in this demo/i);

    expect(screen.getByRole("heading", { name: /heatmap status: preparing/i })).toBeInTheDocument();
    expect(screen.getByText(/no real patient records in this demo/i)).toBeInTheDocument();
    expect(screen.getByText(/live sharing disabled/i)).toBeInTheDocument();
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

  it("records tobacco-use frequency before the estimated packs", async () => {
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
    await screen.findByRole("button", { name: /^continue$/i });
    await user.click(screen.getByRole("button", { name: /^continue$/i }));
    await user.selectOptions(screen.getByLabelText(/tobacco-use frequency/i), "Per week");
    await user.type(screen.getByLabelText(/estimated packs/i), "3");
    await user.click(screen.getByRole("button", { name: /save local draft/i }));

    expect(localStorage.getItem("aeris-screening-draft-v1")).toContain("packFrequency\":\"Per week");
  });

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
