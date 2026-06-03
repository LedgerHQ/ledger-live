import React from "react";
import { fireEvent, screen, render } from "@tests/test-renderer";
import LabelRight from "../LabelRight";

jest.mock("@ledgerhq/live-dmk-mobile", () => ({}), { virtual: true });

describe("DelegationLabelRight", () => {
  it("renders the label", () => {
    render(<LabelRight label="Manage" onPress={jest.fn()} />);
    expect(screen.getByText("Manage")).toBeTruthy();
  });

  it("calls onPress when enabled", () => {
    const onPress = jest.fn();
    render(<LabelRight label="Manage" onPress={onPress} />);
    fireEvent.press(screen.getByText("Manage"));
    expect(onPress).toHaveBeenCalled();
  });

  it("does not call onPress when disabled", () => {
    const onPress = jest.fn();
    render(<LabelRight label="Manage" onPress={onPress} disabled />);
    fireEvent.press(screen.getByText("Manage"));
    expect(onPress).not.toHaveBeenCalled();
  });
});
