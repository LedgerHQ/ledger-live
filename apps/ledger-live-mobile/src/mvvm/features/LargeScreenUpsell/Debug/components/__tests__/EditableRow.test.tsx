import React from "react";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { EditableRow } from "../EditableRow";

describe("EditableRow", () => {
  it("applies the current input value", () => {
    const onApply = jest.fn(() => undefined);
    render(<EditableRow label="field" initialValue="abc" onApply={onApply} />);

    fireEvent.press(screen.getByText("Apply"));

    expect(onApply).toHaveBeenCalledWith("abc");
  });

  it("shows the error returned by onApply", () => {
    const onApply = jest.fn(() => "Invalid value.");
    render(<EditableRow label="field" initialValue="abc" onApply={onApply} />);

    fireEvent.press(screen.getByText("Apply"));

    expect(screen.getByText("Invalid value.")).toBeVisible();
  });

  it("triggers the secondary action", () => {
    const onAction = jest.fn();
    render(
      <EditableRow
        label="field"
        initialValue="abc"
        onApply={jest.fn(() => undefined)}
        actionLabel="Reset"
        onAction={onAction}
      />,
    );

    fireEvent.press(screen.getByText("Reset"));

    expect(onAction).toHaveBeenCalled();
  });
});
