import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceDisconnectedContent } from ".";

describe("DeviceDisconnectedContent", () => {
  it("explains that the device must be reconnected", () => {
    render(<DeviceDisconnectedContent />);

    expect(screen.getByTestId("os-update-device-disconnected")).toBeVisible();
    expect(screen.getByText("Device disconnected")).toBeVisible();
  });

  it("offers no action, as it recovers once the device is back", () => {
    render(<DeviceDisconnectedContent />);

    expect(screen.queryByText("Cancel")).toBeNull();
    expect(screen.queryByText("Retry")).toBeNull();
  });
});
