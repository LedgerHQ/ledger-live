import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceDisconnected } from "./DeviceDisconnected";

describe("DeviceDisconnected", () => {
  it("renders title, description and the primary Retry / secondary Close CTAs", () => {
    render(<DeviceDisconnected onRetry={jest.fn()} onClose={jest.fn()} />);

    expect(screen.getByTestId("device-intent-executor-device-disconnected")).toBeVisible();
    expect(screen.getByText("Device disconnected")).toBeVisible();
    expect(
      screen.getByText(
        "Your Ledger is no longer connected. Make sure it's powered on and within Bluetooth range or plugged in.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Retry")).toBeVisible();
    expect(screen.getByText("Close")).toBeVisible();
  });

  it("invokes onRetry when the primary CTA is pressed", async () => {
    const onRetry = jest.fn();
    const onClose = jest.fn();

    const { user } = render(<DeviceDisconnected onRetry={onRetry} onClose={onClose} />);

    await user.press(screen.getByText("Retry"));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("invokes onClose when the secondary CTA is pressed", async () => {
    const onRetry = jest.fn();
    const onClose = jest.fn();

    const { user } = render(<DeviceDisconnected onRetry={onRetry} onClose={onClose} />);

    await user.press(screen.getByText("Close"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });
});
