import React from "react";
import { render, screen } from "@tests/test-renderer";
import { ToggleRow } from "../ToggleRow";

describe("ToggleRow", () => {
  it("should render label and switch with value", () => {
    const onChange = jest.fn();
    render(<ToggleRow label="Enable feature" value={false} onChange={onChange} />);

    expect(screen.getByText("Enable feature")).toBeVisible();
    expect(screen.getByRole("switch", { checked: false })).toBeVisible();
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
    expect(screen.getByText("Option")).toBeVisible();
    expect(screen.getByText("Optional hint text")).toBeVisible();
    expect(screen.getByRole("switch", { checked: true })).toBeVisible();
  });
});
