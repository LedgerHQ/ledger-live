import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { RetryableStateType } from "@ledgerhq/live-dmk-shared";
import { UserRefusedOnDeviceState } from "./UserRefusedOnDeviceState";
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
      <UserRefusedOnDeviceState
        state={{ type: RetryableStateType.UserRefusedOnDevice, retry }}
        device={device}
        onCancel={onCancel}
      />,
    ),
    retry,
    onCancel,
  };
}

describe("UserRefusedOnDeviceState", () => {
  it("should render the user refused title and action buttons", () => {
    renderState();

    expect(screen.getByText("Operation rejected on device")).toBeVisible();
    expect(screen.getByText("Close")).toBeVisible();
    expect(screen.getByText("Retry")).toBeVisible();
  });

  it("should call onCancel and retry when buttons are pressed", async () => {
    const { user, onCancel, retry } = renderState();

    await user.press(screen.getByText("Close"));
    await user.press(screen.getByText("Retry"));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
