import { fireEvent, render, screen } from "@support/jest/devtools/native";
import { AccountDetail } from "./AccountDetail";

const renderTool = (hasDismissed: boolean, onReset = jest.fn()) =>
  render(<AccountDetail analyticsIntroduction={{ hasDismissed, onReset }} />);

describe("AccountDetail", () => {
  it("resets a dismissed Analytics card", () => {
    const onReset = jest.fn();
    renderTool(true, onReset);

    expect(screen.getByText("Analytics card")).toBeOnTheScreen();
    expect(screen.getByText(/^Dismissed/)).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Reset"));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("ignores presses while the Analytics card is visible", () => {
    const onReset = jest.fn();
    renderTool(false, onReset);

    expect(screen.getByText(/^Visible/)).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Reset"));
    expect(onReset).not.toHaveBeenCalled();
  });
});
