import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceInteractionRequiredType } from "@ledgerhq/live-dmk-shared";
import { UnlockDeviceState } from "./UnlockDeviceState";
import type { InitializerDevice } from "../types";

const device: InitializerDevice = {
  id: "device-id",
  modelId: DeviceModelId.europa,
  name: "Lily's Ledger",
  productName: "Flex",
  wired: false,
};

describe("UnlockDeviceState", () => {
  it("should render the unlock title interpolated with the product name", () => {
    render(
      <UnlockDeviceState
        state={{ type: DeviceInteractionRequiredType.UnlockDevice }}
        device={device}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByText("Unlock your Ledger Flex")).toBeVisible();
  });
});
