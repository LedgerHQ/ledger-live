import { fireEvent, render, screen } from "@support/jest/devtools/native";
import { AccountDetail } from "./AccountDetail";

const renderTool = (
  hasDismissed: boolean,
  onReset = jest.fn(),
  isEligible: boolean | null = true,
  onEligibilityChange = jest.fn(),
) =>
  render(
    <AccountDetail
      analyticsIntroduction={{ hasDismissed, isEligible, onReset, onEligibilityChange }}
    />,
  );

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

    expect(screen.getByText(/^Not dismissed/)).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Reset"));
    expect(onReset).not.toHaveBeenCalled();
  });

  it.each([
    [true, /^Eligible —/],
    [false, /^Not eligible —/],
    [null, /^Not recorded yet/],
  ])("shows the eligibility %s", (isEligible, status) => {
    renderTool(false, jest.fn(), isEligible);

    expect(screen.getByText(status)).toBeOnTheScreen();
  });

  it.each([
    ["Not eligible", true, false],
    ["Not recorded", true, null],
    ["Eligible", false, true],
  ] as const)("forces the eligibility with %s", (option, isEligible, forced) => {
    const onEligibilityChange = jest.fn();
    renderTool(false, jest.fn(), isEligible, onEligibilityChange);

    fireEvent.press(screen.getByText(option));

    expect(onEligibilityChange).toHaveBeenCalledWith(forced);
  });
});
