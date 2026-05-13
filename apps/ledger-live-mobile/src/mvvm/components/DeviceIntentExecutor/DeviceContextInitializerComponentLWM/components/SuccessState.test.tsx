import React from "react";
import { render } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { FinalStateType } from "@ledgerhq/live-dmk-shared";
import { SuccessState } from "./SuccessState";
import type { InitializerDevice } from "../types";

const device: InitializerDevice = {
  id: "device-id",
  modelId: DeviceModelId.europa,
  supportedModelId: DeviceModelId.europa,
  name: "Lily's Ledger",
  productName: "Flex",
  wired: false,
};

describe("SuccessState", () => {
  it("should not render any content", () => {
    const { toJSON } = render(
      <SuccessState
        state={{
          type: FinalStateType.Success,
          extractedContext: {
            currentOsVersion: "2.2.0",
            osUpdateAvailable: false,
            currentAppName: "Ethereum",
            currentAppVersion: "1.0.0",
            derivedAddress: undefined,
          },
        }}
        device={device}
        onCancel={jest.fn()}
      />,
    );

    expect(toJSON()).toBeNull();
  });
});
