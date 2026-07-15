import React from "react";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";

import { NoKnownDeviceState } from "./NoKnownDeviceState";

describe("NoKnownDeviceState", () => {
  it("GIVEN there is no known device WHEN rendering THEN it shows the no known device copy", () => {
    // WHEN
    render(<NoKnownDeviceState onConnectLedgerDevice={jest.fn()} onBuyLedgerDevice={jest.fn()} />);

    // THEN
    expect(screen.getByText("Ledger device required")).toBeVisible();
    expect(screen.getByText("To continue, set up or connect your signer.")).toBeVisible();
  });

  it("GIVEN there is no known device WHEN clicking the connect CTA THEN it calls the connect callback", async () => {
    // GIVEN
    const onConnectLedgerDevice = jest.fn();
    const { user } = render(
      <NoKnownDeviceState
        onConnectLedgerDevice={onConnectLedgerDevice}
        onBuyLedgerDevice={jest.fn()}
      />,
    );

    // WHEN
    await user.click(screen.getByRole("button", { name: "Connect Ledger device" }));

    // THEN
    expect(onConnectLedgerDevice).toHaveBeenCalledTimes(1);
  });

  it("GIVEN there is no known device WHEN clicking the buy device CTA THEN it calls the buy device callback", async () => {
    // GIVEN
    const onBuyLedgerDevice = jest.fn();
    const { user } = render(
      <NoKnownDeviceState
        onConnectLedgerDevice={jest.fn()}
        onBuyLedgerDevice={onBuyLedgerDevice}
      />,
    );

    // WHEN
    await user.click(screen.getByRole("button", { name: "I don't have a Ledger device" }));

    // THEN
    expect(onBuyLedgerDevice).toHaveBeenCalledTimes(1);
  });
});
