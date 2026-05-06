import React from "react";
import { render, screen } from "@tests/test-renderer";
import { NoKnownDeviceState } from "./NoKnownDeviceState";

function renderState() {
  const onConnectLedgerDevice = jest.fn();
  const onBuyLedgerDevice = jest.fn();
  const view = render(
    <NoKnownDeviceState
      onConnectLedgerDevice={onConnectLedgerDevice}
      onBuyLedgerDevice={onBuyLedgerDevice}
    />,
  );

  return { ...view, onConnectLedgerDevice, onBuyLedgerDevice };
}

describe("NoKnownDeviceState", () => {
  it("should render the no known device title and description", () => {
    renderState();

    expect(screen.getByText("Ledger device required")).toBeVisible();
    expect(screen.getByText("To continue, set up or connect your signer.")).toBeVisible();
  });

  it("should call the action callbacks when buttons are pressed", async () => {
    const { user, onConnectLedgerDevice, onBuyLedgerDevice } = renderState();

    await user.press(screen.getByText("Connect Ledger device"));
    await user.press(screen.getByText("I don't have a Ledger device"));

    expect(onConnectLedgerDevice).toHaveBeenCalledTimes(1);
    expect(onBuyLedgerDevice).toHaveBeenCalledTimes(1);
  });
});
