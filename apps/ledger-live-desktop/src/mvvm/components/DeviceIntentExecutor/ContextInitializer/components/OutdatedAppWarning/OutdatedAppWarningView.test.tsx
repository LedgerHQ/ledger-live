import React from "react";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import { OutdatedAppWarningView } from "./OutdatedAppWarningView";

describe("OutdatedAppWarningView", () => {
  const renderView = () => {
    const onOpenMyLedger = jest.fn();
    const onContinue = jest.fn();
    const { user } = render(
      <OutdatedAppWarningView
        appName="Ethereum"
        onOpenMyLedger={onOpenMyLedger}
        onContinue={onContinue}
      />,
    );
    return { user, onOpenMyLedger, onContinue };
  };

  it("GIVEN the outdated app view WHEN rendering THEN it shows the outdated app copy", () => {
    // GIVEN
    renderView();

    // THEN
    expect(screen.getByText("App version outdated")).toBeVisible();
  });

  it("GIVEN the outdated app view WHEN clicking Open My Ledger THEN it opens the manager", async () => {
    // GIVEN
    const { user, onOpenMyLedger, onContinue } = renderView();

    // WHEN
    await user.click(screen.getByRole("button", { name: "Open My Ledger" }));

    // THEN
    expect(onOpenMyLedger).toHaveBeenCalledTimes(1);
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("GIVEN the outdated app view WHEN clicking Continue THEN it continues", async () => {
    // GIVEN
    const { user, onOpenMyLedger, onContinue } = renderView();

    // WHEN
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // THEN
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onOpenMyLedger).not.toHaveBeenCalled();
  });
});
