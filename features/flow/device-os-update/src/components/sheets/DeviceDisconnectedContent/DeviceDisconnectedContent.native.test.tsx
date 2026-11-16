import React from "react";
import { render, screen } from "../../../__tests__/render";
import { DeviceDisconnectedContent } from "./DeviceDisconnectedContent";

describe("DeviceDisconnectedContent", () => {
  it("asks to power on and unlock the device", () => {
    render(
      <DeviceDisconnectedContent
        actionModelId="apex"
        deviceName="Lily's Nano"
        productName="Ledger Nano Gen5"
      />,
    );

    expect(screen.getByTestId("os-update-device-disconnected")).toBeVisible();
    expect(screen.getByText("Power on and unlock your Ledger Nano Gen5")).toBeVisible();
    expect(screen.getByText("Lily's Nano")).toBeVisible();
  });

  it("offers no action, as it recovers once the device is back", () => {
    render(
      <DeviceDisconnectedContent
        actionModelId="apex"
        deviceName="Lily's Nano"
        productName="Ledger Nano Gen5"
      />,
    );

    expect(screen.queryByText("Cancel")).toBeNull();
    expect(screen.queryByText("Retry")).toBeNull();
  });
});
