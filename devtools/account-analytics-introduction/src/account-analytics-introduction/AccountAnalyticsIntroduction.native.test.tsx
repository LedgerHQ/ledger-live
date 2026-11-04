import { fireEvent, render, screen } from "@support/jest/devtools/native";
import { AccountAnalyticsIntroduction } from "./AccountAnalyticsIntroduction";

describe("AccountAnalyticsIntroduction", () => {
  it("resets a dismissed card", () => {
    const onReset = jest.fn();
    render(<AccountAnalyticsIntroduction hasDismissed onReset={onReset} />);

    expect(screen.getByText(/^Dismissed/)).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Reset"));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("ignores presses while the card is visible", () => {
    const onReset = jest.fn();
    render(<AccountAnalyticsIntroduction hasDismissed={false} onReset={onReset} />);

    expect(screen.getByText(/^Visible/)).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Reset"));
    expect(onReset).not.toHaveBeenCalled();
  });
});
