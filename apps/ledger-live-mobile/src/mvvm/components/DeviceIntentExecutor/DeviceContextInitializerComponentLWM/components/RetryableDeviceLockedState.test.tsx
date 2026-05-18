import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { RetryableStateType } from "@ledgerhq/live-dmk-shared";
import { RetryableDeviceLockedState } from "./RetryableDeviceLockedState";
import type { InitializerDevice } from "../types";

const device: InitializerDevice = {
  id: "device-id",
  modelId: DeviceModelId.europa,
  name: "Lily's Ledger",
  productName: "Flex",
  wired: false,
};

function renderState() {
  const retry = jest.fn();
  const onCancel = jest.fn();

  return {
    ...render(
      <RetryableDeviceLockedState
        state={{ type: RetryableStateType.DeviceLocked, retry }}
        device={device}
        onCancel={onCancel}
      />,
    ),
    retry,
    onCancel,
  };
}

describe("RetryableDeviceLockedState", () => {
  it("should render the locked title and the retry CTA", () => {
    renderState();

    expect(screen.getByText("Device is locked")).toBeVisible();
    expect(screen.getByText("Retry")).toBeVisible();
  });

  it("should call retry when the retry button is pressed", async () => {
    const { user, retry } = renderState();

    await user.press(screen.getByText("Retry"));

    expect(retry).toHaveBeenCalledTimes(1);
  });
});
