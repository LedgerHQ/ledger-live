import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceInteractionRequiredType } from "@ledgerhq/live-dmk-shared";
import { ConfirmOpenAppState } from "./ConfirmOpenAppState";
import type { InitializerDevice } from "../types";

const device: InitializerDevice = {
  id: "device-id",
  modelId: DeviceModelId.europa,
  name: "Lily's Ledger",
  productName: "Flex",
  wired: false,
};

describe("ConfirmOpenAppState", () => {
  it("should render the pending action title and description", () => {
    render(
      <ConfirmOpenAppState
        state={{ type: DeviceInteractionRequiredType.ConfirmOpenApp }}
        device={device}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByText("Continue on your Ledger Flex")).toBeVisible();
    expect(
      screen.getByText(/Follow the instructions displayed on your Secure.Screen/),
    ).toBeVisible();
  });
});
