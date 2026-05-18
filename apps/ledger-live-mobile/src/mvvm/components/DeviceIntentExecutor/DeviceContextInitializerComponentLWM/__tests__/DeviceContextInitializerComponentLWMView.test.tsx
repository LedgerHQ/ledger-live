import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  BlockingStateType,
  FinalStateType,
  LoadingStateType,
  type EnsureAppReadyState,
} from "@ledgerhq/live-dmk-shared";
import { DeviceContextInitializerComponentLWMView } from "../DeviceContextInitializerComponentLWMView";
import type { InitializerDevice } from "../types";

const device: InitializerDevice = {
  id: "device-id",
  modelId: DeviceModelId.europa,
  name: "Lily's Ledger",
  productName: "Flex",
  wired: false,
};

function renderView(state: EnsureAppReadyState) {
  return render(
    <DeviceContextInitializerComponentLWMView state={state} device={device} onCancel={jest.fn()} />,
  );
}

describe("DeviceContextInitializerComponentLWMView", () => {
  it("should render the loading state", () => {
    renderView({ type: LoadingStateType.Loading });

    expect(screen.getByText("Loading")).toBeVisible();
  });

  it("should render the device storage blocking state", () => {
    renderView({
      type: BlockingStateType.DeviceOutOfStorageSpace,
      appNames: ["Ethereum"],
    });

    expect(screen.getByText("Not enough device memory")).toBeVisible();
    expect(screen.getByText("Go to My Ledger")).toBeVisible();
  });

  it("should render no content for the success state", () => {
    const { queryByText } = renderView({
      type: FinalStateType.Success,
      extractedContext: {
        currentOsVersion: "2.2.0",
        osUpdateAvailable: false,
        currentAppName: "Ethereum",
        currentAppVersion: "1.0.0",
        derivedAddress: undefined,
      },
    });

    expect(queryByText("Success")).toBeNull();
  });
});
