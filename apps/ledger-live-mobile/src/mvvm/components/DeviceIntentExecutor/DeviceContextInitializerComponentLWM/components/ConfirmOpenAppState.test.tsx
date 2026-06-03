import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceInteractionRequiredType } from "@ledgerhq/live-dmk-shared";
import { TrackScreen } from "~/analytics";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import { ConfirmOpenAppState } from "./ConfirmOpenAppState";
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
    <ConfirmOpenAppState
      state={{ type: DeviceInteractionRequiredType.ConfirmOpenApp }}
      device={device}
      sourceFlow="my_ledger"
      onCancel={jest.fn()}
    />,
  );
}

describe("ConfirmOpenAppState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GIVEN the confirm open app state WHEN rendering THEN it renders the pending action copy", () => {
    renderState();

    expect(screen.getByText("Continue on your Ledger Flex")).toBeVisible();
    expect(
      screen.getByText(/Follow the instructions displayed on your Secure.Screen/),
    ).toBeVisible();
  });

  it("GIVEN the confirm open app state WHEN rendering THEN it fires the page event with sourceFlow and modelId", () => {
    renderState();

    expect(mockedTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        category: PAGE_CONNECT_APP.ConfirmOpenApp,
        sourceFlow: "my_ledger",
        modelId: DeviceModelId.europa,
        deviceUxV2: true,
      }),
      undefined,
    );
  });
});
