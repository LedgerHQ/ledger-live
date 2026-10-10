import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen } from "@tests/test-renderer";
import { DeviceLockedContent } from ".";

describe("DeviceLockedContent", () => {
  it("asks to unlock the device", () => {
    render(<DeviceLockedContent deviceModelId={DeviceModelId.stax} deviceName="Ledger Stax" />);

    expect(screen.getByTestId("os-update-device-locked")).toBeVisible();
    expect(screen.getByText("Unlock your Ledger Stax")).toBeVisible();
  });

  it("offers no action, as it recovers once the device is unlocked", () => {
    render(<DeviceLockedContent deviceModelId={DeviceModelId.stax} deviceName="Ledger Stax" />);

    expect(screen.queryByText("Cancel")).toBeNull();
    expect(screen.queryByText("Retry")).toBeNull();
  });
});
