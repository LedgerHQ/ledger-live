import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceInteractionRequiredType } from "@ledgerhq/live-dmk-shared";
import { AllowSecureConnectionState } from "./AllowSecureConnectionState";
import type { InitializerDevice } from "../types";

const device: InitializerDevice = {
  id: "device-id",
  modelId: DeviceModelId.europa,
  supportedModelId: DeviceModelId.europa,
  name: "Lily's Ledger",
  productName: "Flex",
  wired: false,
};

describe("AllowSecureConnectionState", () => {
  it("should render the pending action title and description", () => {
    render(
      <AllowSecureConnectionState
        state={{ type: DeviceInteractionRequiredType.AllowSecureConnection }}
        device={device}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByText("Action pending on your Flex")).toBeVisible();
    expect(screen.getByText("Finish the action to continue.")).toBeVisible();
  });
});
