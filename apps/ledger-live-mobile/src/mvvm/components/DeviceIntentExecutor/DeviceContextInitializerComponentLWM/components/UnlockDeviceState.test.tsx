import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceInteractionRequiredType } from "@ledgerhq/live-dmk-shared";
import { TrackScreen } from "~/analytics";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import { UnlockDeviceState } from "./UnlockDeviceState";
import type { InitializerDevice } from "../types";

jest.mock("~/analytics", () => {
  const actual = jest.requireActual("~/analytics");
  return {
    ...actual,
    TrackScreen: jest.fn(() => null),
  };
});

const mockedTrackScreen = jest.mocked(TrackScreen);

const device: InitializerDevice = {
  id: "device-id",
  modelId: DeviceModelId.europa,
  name: "Lily's Ledger",
  productName: "Flex",
  wired: false,
};

function renderState() {
  return render(
    <UnlockDeviceState
      state={{ type: DeviceInteractionRequiredType.UnlockDevice }}
      device={device}
      sourceFlow="my_ledger"
      onCancel={jest.fn()}
    />,
  );
}

describe("UnlockDeviceState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GIVEN the unlock device state WHEN rendering THEN it renders the unlock title with the product name", () => {
    renderState();

    expect(screen.getByText("Unlock your Ledger Flex")).toBeVisible();
  });

  it("GIVEN the unlock device state WHEN rendering THEN it fires the page event with sourceFlow and modelId", () => {
    renderState();

    expect(mockedTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        category: PAGE_CONNECT_APP.UnlockDevice,
        sourceFlow: "my_ledger",
        modelId: DeviceModelId.europa,
        deviceUxV2: true,
      }),
      undefined,
    );
  });
});
