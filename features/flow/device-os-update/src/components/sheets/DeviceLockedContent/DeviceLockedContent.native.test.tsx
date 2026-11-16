import React from "react";
import { render, screen } from "../../../__tests__/render";
import { DeviceLockedContent } from "./DeviceLockedContent";

describe("DeviceLockedContent", () => {
  it("asks to unlock the device", () => {
    render(
      <DeviceLockedContent
        actionModelId="stax"
        deviceName="Ledger Stax"
        productName="Ledger Stax"
      />,
    );

    expect(screen.getByTestId("os-update-device-locked")).toBeVisible();
    expect(screen.getByText("Unlock your Ledger Stax")).toBeVisible();
  });

  it("offers no action, as it recovers once the device is unlocked", () => {
    render(
      <DeviceLockedContent
        actionModelId="stax"
        deviceName="Ledger Stax"
        productName="Ledger Stax"
      />,
    );

    expect(screen.queryByText("Cancel")).toBeNull();
    expect(screen.queryByText("Retry")).toBeNull();
  });
});
