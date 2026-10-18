import React from "react";
import { render, screen } from "@tests/test-renderer";
import { OutdatedAppWarningView } from "./OutdatedAppWarningView";

function renderView() {
  const onOpenMyLedger = jest.fn();
  const onContinue = jest.fn();

  return {
    ...render(
      <OutdatedAppWarningView
        appName="Ethereum"
        onOpenMyLedger={onOpenMyLedger}
        onContinue={onContinue}
      />,
    ),
    onOpenMyLedger,
    onContinue,
  };
}

describe("OutdatedAppWarningView", () => {
  it("should render the outdated app copy interpolated with the app name", () => {
    renderView();

    expect(screen.getByText("App version outdated")).toBeVisible();
    expect(
      screen.getByText(
        "An important update is available for the Ethereum application on your device. Please go to My Ledger to update it.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Open My Ledger")).toBeVisible();
    expect(screen.getByText("Continue")).toBeVisible();
  });

  it("should call onOpenMyLedger and onContinue when action buttons are pressed", async () => {
    const { user, onOpenMyLedger, onContinue } = renderView();

    await user.press(screen.getByText("Open My Ledger"));
    await user.press(screen.getByText("Continue"));

    expect(onOpenMyLedger).toHaveBeenCalledTimes(1);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
