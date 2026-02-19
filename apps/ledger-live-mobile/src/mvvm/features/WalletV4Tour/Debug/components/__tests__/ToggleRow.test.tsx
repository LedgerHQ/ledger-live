import React from "react";
import { render, screen } from "@tests/test-renderer";
import { ToggleRow } from "../ToggleRow";

describe("ToggleRow", () => {
  it("should render label and switch with value", () => {
    const onChange = jest.fn();
    render(<ToggleRow label="Enable feature" value={false} onChange={onChange} />);

    expect(screen.getByText("Enable feature")).toBeOnTheScreen();
    expect(screen.getByRole("switch", { checked: false })).toBeOnTheScreen();
  });

  it("should render description when provided", () => {
    render(
      <ToggleRow
        label="Option"
        value={true}
        onChange={jest.fn()}
        description="Optional hint text"
      />,
    );
    expect(screen.getByText("Option")).toBeOnTheScreen();
    expect(screen.getByText("Optional hint text")).toBeOnTheScreen();
    expect(screen.getByRole("switch", { checked: true })).toBeOnTheScreen();
  });

  it("should call onChange with toggled value when switch is pressed", async () => {
    const onChange = jest.fn();
    const { user } = render(<ToggleRow label="Toggle" value={false} onChange={onChange} />);

    await user.press(screen.getByRole("switch", { checked: false }));

    expect(onChange).toHaveBeenCalledWith(true);
  });
});
