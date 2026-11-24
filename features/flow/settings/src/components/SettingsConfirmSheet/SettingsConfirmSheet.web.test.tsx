import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsConfirmSheet } from "./SettingsConfirmSheet";
import type { SettingsConfirmSheetProps } from "./SettingsConfirmSheet.types";

const labels = {
  title: "Clear cache?",
  description: "Your accounts will sync again.",
  confirm: "Clear",
  cancel: "Cancel",
};

const renderSheet = (props: Partial<SettingsConfirmSheetProps> = {}) => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  render(
    <SettingsConfirmSheet
      isOpen
      tone="destructive"
      labels={labels}
      onConfirm={onConfirm}
      onCancel={onCancel}
      confirmTestID="confirm"
      cancelTestID="cancel"
      {...props}
    />,
  );
  return { onConfirm, onCancel };
};

describe("SettingsConfirmSheet", () => {
  it("shows the question and both actions", () => {
    renderSheet();

    expect(screen.getByText("Clear cache?")).toBeInTheDocument();
    expect(screen.getByText("Your accounts will sync again.")).toBeInTheDocument();
    expect(screen.getByTestId("confirm")).toHaveTextContent("Clear");
    expect(screen.getByTestId("cancel")).toHaveTextContent("Cancel");
  });

  it("reports the confirmation", async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderSheet();

    await user.click(screen.getByTestId("confirm"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("reports the cancel", async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderSheet();

    await user.click(screen.getByTestId("cancel"));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("disables both actions while confirming", () => {
    renderSheet({ isConfirming: true });

    expect(screen.getByTestId("confirm")).toBeDisabled();
    expect(screen.getByTestId("cancel")).toBeDisabled();
  });

  it("cannot be closed while confirming", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderSheet({ isConfirming: true });

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onCancel).not.toHaveBeenCalled();
  });
});
