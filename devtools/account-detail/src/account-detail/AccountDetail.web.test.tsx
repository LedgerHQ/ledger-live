import { render, screen } from "@support/jest/devtools/web";
import userEvent from "@testing-library/user-event";
import { AccountDetail } from "./AccountDetail";

const renderTool = (hasDismissed: boolean, onReset = jest.fn()) =>
  render(<AccountDetail analyticsIntroduction={{ hasDismissed, onReset }} />);

describe("AccountDetail", () => {
  it("resets a dismissed Analytics card", async () => {
    const onReset = jest.fn();
    renderTool(true, onReset);

    expect(screen.getByRole("heading", { name: "Analytics card" })).toBeVisible();
    expect(screen.getByText(/^Dismissed/)).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("disables the reset while the Analytics card is visible", () => {
    renderTool(false);

    expect(screen.getByText(/^Visible/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Reset" })).toBeDisabled();
  });
});
