import React from "react";
import { screen } from "@testing-library/react";

import { renderWithUser } from "../testUtils";
import { NoKnownDeviceState } from "./NoKnownDeviceState";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const { mockT } = jest.requireActual("../testUtils");
      return mockT(key, params);
    },
  }),
}));

describe("NoKnownDeviceState", () => {
  it("should render the no known device copy", () => {
    renderWithUser(
      <NoKnownDeviceState onConnectLedgerDevice={jest.fn()} onBuyLedgerDevice={jest.fn()} />,
    );

    expect(screen.getByText("Ledger device required")).toBeVisible();
    expect(screen.getByText("To continue, set up or connect your signer.")).toBeVisible();
  });

  it("should call the connect callback when the connect CTA is clicked", async () => {
    const onConnectLedgerDevice = jest.fn();
    const { user } = renderWithUser(
      <NoKnownDeviceState
        onConnectLedgerDevice={onConnectLedgerDevice}
        onBuyLedgerDevice={jest.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Connect Ledger device" }));

    expect(onConnectLedgerDevice).toHaveBeenCalledTimes(1);
  });

  it("should call the buy device callback when the buy CTA is clicked", async () => {
    const onBuyLedgerDevice = jest.fn();
    const { user } = renderWithUser(
      <NoKnownDeviceState
        onConnectLedgerDevice={jest.fn()}
        onBuyLedgerDevice={onBuyLedgerDevice}
      />,
    );

    await user.click(screen.getByRole("button", { name: "I don't have a Ledger device" }));

    expect(onBuyLedgerDevice).toHaveBeenCalledTimes(1);
  });
});
