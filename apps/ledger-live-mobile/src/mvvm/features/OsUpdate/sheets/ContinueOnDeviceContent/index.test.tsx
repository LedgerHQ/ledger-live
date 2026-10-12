import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen } from "@tests/test-renderer";
import { ContinueOnDeviceContent } from ".";

describe("ContinueOnDeviceContent", () => {
  it("asks to continue on the device", () => {
    render(<ContinueOnDeviceContent deviceModelId={DeviceModelId.stax} deviceName="Ledger Stax" />);

    expect(screen.getByTestId("os-update-continue-on-device")).toBeVisible();
    expect(screen.getByText("Continue on your Ledger Stax")).toBeVisible();
  });

  it("offers no action", () => {
    render(<ContinueOnDeviceContent deviceModelId={DeviceModelId.stax} deviceName="Ledger Stax" />);

    expect(screen.queryByText("Cancel")).toBeNull();
  });
});
