import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen } from "@tests/test-renderer";
import { DeviceDisconnectedContent } from ".";

describe("DeviceDisconnectedContent", () => {
  it("asks to power on and unlock the device", () => {
    render(
      <DeviceDisconnectedContent deviceModelId={DeviceModelId.apex} deviceName="Lily's Nano" />,
    );

    expect(screen.getByTestId("os-update-device-disconnected")).toBeVisible();
    expect(screen.getByText("Power on and unlock your Ledger Nano Gen5")).toBeVisible();
    expect(screen.getByText("Lily's Nano")).toBeVisible();
  });

  it("offers no action, as it recovers once the device is back", () => {
    render(
      <DeviceDisconnectedContent deviceModelId={DeviceModelId.apex} deviceName="Lily's Nano" />,
    );

    expect(screen.queryByText("Cancel")).toBeNull();
    expect(screen.queryByText("Retry")).toBeNull();
  });
});
