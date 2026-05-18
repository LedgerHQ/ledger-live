import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { RetryableStateType } from "@ledgerhq/live-dmk-shared";
import { DeviceBusyState } from "./DeviceBusyState";
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
      <DeviceBusyState
        state={{ type: RetryableStateType.DeviceBusy, retry }}
        device={device}
        onCancel={onCancel}
      />,
    ),
    retry,
    onCancel,
  };
}

describe("DeviceBusyState", () => {
  it("should render the device busy title, description and action buttons", () => {
    renderState();

    expect(screen.getByText("Action pending on your Ledger device")).toBeVisible();
    expect(screen.getByText("Complete it and then select Retry.")).toBeVisible();
    expect(screen.getByText("Retry")).toBeVisible();
    expect(screen.getByText("Cancel operation")).toBeVisible();
  });

  it("should call retry and onCancel when action buttons are pressed", async () => {
    const { user, retry, onCancel } = renderState();

    await user.press(screen.getByText("Retry"));
    await user.press(screen.getByText("Cancel operation"));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
