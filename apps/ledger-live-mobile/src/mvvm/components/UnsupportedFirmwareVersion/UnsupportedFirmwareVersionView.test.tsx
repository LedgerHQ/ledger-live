import React from "react";
import { render, screen } from "@tests/test-renderer";
import { UnsupportedFirmwareVersionView } from "./UnsupportedFirmwareVersionView";

function renderView() {
  const onUpdateLedgerOs = jest.fn();
  const onCancel = jest.fn();

  return {
    ...render(
      <UnsupportedFirmwareVersionView onUpdateLedgerOs={onUpdateLedgerOs} onCancel={onCancel} />,
    ),
    onUpdateLedgerOs,
    onCancel,
  };
}

describe("UnsupportedFirmwareVersionView", () => {
  it("should render the unsupported firmware copy and action buttons", () => {
    renderView();

    expect(screen.getByText("Ledger OS update required")).toBeVisible();
    expect(screen.getByText("Update Ledger OS")).toBeVisible();
    expect(screen.getByText("Cancel operation")).toBeVisible();
  });

  it("should call onUpdateLedgerOs and onCancel when action buttons are pressed", async () => {
    const { user, onUpdateLedgerOs, onCancel } = renderView();

    await user.press(screen.getByText("Update Ledger OS"));
    await user.press(screen.getByText("Cancel operation"));

    expect(onUpdateLedgerOs).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
