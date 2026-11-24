import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { SettingsConfirmSheet } from "./SettingsConfirmSheet";

const labels = {
  title: "Reset Ledger Wallet?",
  description: "This deletes the app data on this phone.",
  confirm: "Reset",
  cancel: "Cancel",
};

describe("SettingsConfirmSheet", () => {
  it("shows the question and reports the confirmation", async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    render(
      <SettingsConfirmSheet
        isOpen
        tone="destructive"
        labels={labels}
        onConfirm={onConfirm}
        onCancel={jest.fn()}
        confirmTestID="confirm"
        testID="reset-sheet"
      />,
    );

    expect(screen.getByTestId("reset-sheet-header")).toHaveProp("title", "Reset Ledger Wallet?");
    await user.press(screen.getByTestId("confirm"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("reports the cancel", async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    render(
      <SettingsConfirmSheet
        isOpen
        tone="neutral"
        labels={labels}
        onConfirm={jest.fn()}
        onCancel={onCancel}
        cancelTestID="cancel"
      />,
    );

    await user.press(screen.getByTestId("cancel"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
