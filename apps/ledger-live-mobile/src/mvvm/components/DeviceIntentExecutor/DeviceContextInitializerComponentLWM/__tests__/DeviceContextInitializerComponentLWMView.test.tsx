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
    <DeviceContextInitializerComponentLWMView
      state={state}
      device={device}
      sourceFlow="my_ledger"
      onCancel={jest.fn()}
    />,
  );
}

describe("DeviceContextInitializerComponentLWMView", () => {
  it("GIVEN the loading state WHEN rendering THEN it renders the loading content", () => {
    renderView({ type: LoadingStateType.Loading });

    expect(screen.getByText("Loading")).toBeVisible();
  });

  it("GIVEN the device storage blocking state WHEN rendering THEN it renders the storage content", () => {
    renderView({
      type: BlockingStateType.DeviceOutOfStorageSpace,
      appNames: ["Ethereum"],
    });

    expect(screen.getByText("Not enough device memory")).toBeVisible();
    expect(screen.getByText("Go to My Ledger")).toBeVisible();
  });

  it("GIVEN the success state WHEN rendering THEN it renders no content", () => {
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
