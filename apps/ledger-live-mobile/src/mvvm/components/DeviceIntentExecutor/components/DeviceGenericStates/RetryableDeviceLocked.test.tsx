import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { RetryableDeviceLocked } from "./RetryableDeviceLocked";

function renderComponent() {
  const onRetry = jest.fn();

  return {
    ...render(<RetryableDeviceLocked deviceModelId={DeviceModelId.europa} onRetry={onRetry} />),
    onRetry,
  };
}

describe("RetryableDeviceLocked", () => {
  it("should render the locked title, description, and the retry CTA", () => {
    renderComponent();

    expect(screen.getByText("Device is locked")).toBeVisible();
    expect(screen.getByText("Unlock your device to continue.")).toBeVisible();
    expect(screen.getByText("Retry")).toBeVisible();
  });

  it("should call onRetry when the retry button is pressed", async () => {
    const { user, onRetry } = renderComponent();

    await user.press(screen.getByText("Retry"));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
