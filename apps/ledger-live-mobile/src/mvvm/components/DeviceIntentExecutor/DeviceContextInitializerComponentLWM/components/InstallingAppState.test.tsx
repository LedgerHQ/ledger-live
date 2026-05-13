import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { LoadingStateType } from "@ledgerhq/live-dmk-shared";
import { InstallingAppState } from "./InstallingAppState";
import type { InitializerDevice } from "../types";

const device: InitializerDevice = {
  id: "device-id",
  modelId: DeviceModelId.europa,
  supportedModelId: DeviceModelId.europa,
  name: "Lily's Ledger",
  productName: "Flex",
  wired: false,
};

describe("InstallingAppState", () => {
  it("should render the installing app title", () => {
    render(
      <InstallingAppState
        state={{ type: LoadingStateType.InstallingApp }}
        device={device}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByText("Installing app")).toBeVisible();
  });
});
