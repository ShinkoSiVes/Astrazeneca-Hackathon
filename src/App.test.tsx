import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

    const enterButton = screen.getByRole("button", { name: /enter screening workspace/i });
    expect(enterButton).toBeDisabled();
    await user.type(screen.getByLabelText(/demo passcode/i), "1234");
    await user.click(enterButton);

    expect(screen.getByRole("heading", { name: /you’re signed in as bhw-024/i })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveClass("view-ready");
    expect(sessionStorage.getItem("idea-demo-clinician")).toBe("BHW-024");
  });
});
