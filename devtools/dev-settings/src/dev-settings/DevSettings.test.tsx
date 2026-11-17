import { render, screen } from "@support/jest/devtools/web";
import userEvent from "@testing-library/user-event";
import type { DevSettingsToggle } from "../types";
import { DevSettings } from "./DevSettings";

const aToggle = (overrides: Partial<DevSettingsToggle> = {}): DevSettingsToggle => ({
  id: "hide-overlay",
  label: "Hide overlay",
  description: "Hide the overlay.",
  isOn: false,
  lockedReason: null,
  onChange: jest.fn(),
  ...overrides,
});

describe("DevSettings", () => {
  it("turns a toggle on", async () => {
    const onChange = jest.fn();
    render(<DevSettings toggles={[aToggle({ onChange })]} />);

    expect(screen.getByText("Hide the overlay.")).toBeVisible();
    await userEvent.click(screen.getByRole("switch", { name: "Hide overlay" }));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("turns a toggle off", async () => {
    const onChange = jest.fn();
    render(<DevSettings toggles={[aToggle({ isOn: true, onChange })]} />);

    expect(screen.getByRole("switch", { name: "Hide overlay" })).toBeChecked();
    await userEvent.click(screen.getByRole("switch", { name: "Hide overlay" }));

    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("locks a toggle that can't apply and says why", async () => {
    const onChange = jest.fn();
    render(<DevSettings toggles={[aToggle({ lockedReason: "Nightly builds only.", onChange })]} />);

    expect(screen.getByText("Nightly builds only.")).toBeVisible();
    expect(screen.getByRole("switch", { name: "Hide overlay" })).toBeDisabled();
    await userEvent.click(screen.getByRole("switch", { name: "Hide overlay" }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("says when there is no toggle", () => {
    render(<DevSettings toggles={[]} />);

    expect(screen.getByText("This app has no toggle yet.")).toBeVisible();
  });
});
