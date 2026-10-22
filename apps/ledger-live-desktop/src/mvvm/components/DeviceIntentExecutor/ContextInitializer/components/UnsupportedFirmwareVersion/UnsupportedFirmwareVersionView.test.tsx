import React from "react";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import { UnsupportedFirmwareVersionView } from "./UnsupportedFirmwareVersionView";

describe("UnsupportedFirmwareVersionView", () => {
  const renderView = () => {
    const onUpdateLedgerOs = jest.fn();
    const onCancel = jest.fn();
    const { user } = render(
      <UnsupportedFirmwareVersionView onUpdateLedgerOs={onUpdateLedgerOs} onCancel={onCancel} />,
    );
    return { user, onUpdateLedgerOs, onCancel };
  };

  it("GIVEN the unsupported firmware view WHEN rendering THEN it shows the update required copy", () => {
    // GIVEN
    renderView();

    // THEN
    expect(screen.getByText("Ledger OS update required")).toBeVisible();
  });

  it("GIVEN the unsupported firmware view WHEN clicking Update Ledger OS THEN it calls update", async () => {
    // GIVEN
    const { user, onUpdateLedgerOs, onCancel } = renderView();

    // WHEN
    await user.click(screen.getByRole("button", { name: "Update Ledger OS" }));

    // THEN
    expect(onUpdateLedgerOs).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("GIVEN the unsupported firmware view WHEN clicking Cancel THEN it calls cancel", async () => {
    // GIVEN
    const { user, onUpdateLedgerOs, onCancel } = renderView();

    // WHEN
    await user.click(screen.getByRole("button", { name: "Cancel operation" }));

    // THEN
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onUpdateLedgerOs).not.toHaveBeenCalled();
  });
});
