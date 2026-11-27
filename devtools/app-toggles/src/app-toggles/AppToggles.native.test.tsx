import { render, screen } from "@support/jest/devtools/native";
import { userEvent } from "@testing-library/react-native";
import type { AppToggle } from "../types";
import { AppToggles } from "./AppToggles";

const aToggle = (overrides: Partial<AppToggle> = {}): AppToggle => ({
  id: "simulate-apollo",
  label: "Simulate an Apollo device",
  description: "Hide the rows Apollo hides.",
  isOn: false,
  lockedReason: null,
  onChange: jest.fn(),
  ...overrides,
});

describe("AppToggles (native)", () => {
  it("turns a toggle on", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<AppToggles toggles={[aToggle({ onChange })]} />);

    expect(screen.getByText("Hide the rows Apollo hides.")).toBeVisible();
    await user.press(screen.getByTestId("app-toggles-simulate-apollo"));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("turns a toggle off", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<AppToggles toggles={[aToggle({ isOn: true, onChange })]} />);

    await user.press(screen.getByTestId("app-toggles-simulate-apollo"));

    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("locks a toggle that can't apply and says why", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<AppToggles toggles={[aToggle({ lockedReason: "Android only.", onChange })]} />);

    expect(screen.getByText("Android only.")).toBeVisible();
    await user.press(screen.getByTestId("app-toggles-simulate-apollo"));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("says when there is no toggle", () => {
    render(<AppToggles toggles={[]} />);

    expect(screen.getByText("This app has no toggle yet.")).toBeVisible();
  });
});
