import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { LoadingStateType } from "@ledgerhq/live-dmk-shared";
import { LoadingState } from "./LoadingState";
import type { InitializerDevice } from "../types";

const device: InitializerDevice = {
  id: "device-id",
  modelId: DeviceModelId.europa,
  supportedModelId: DeviceModelId.europa,
  name: "Lily's Ledger",
  productName: "Flex",
  wired: false,
};

describe("LoadingState", () => {
  it("should render the loading title", () => {
    render(
      <LoadingState
        state={{ type: LoadingStateType.Loading }}
        device={device}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByText("Loading")).toBeVisible();
  });
});
