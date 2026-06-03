import React from "react";
import { render, screen } from "@tests/test-renderer";
import { ConnectDeviceUIStateTypes } from "@ledgerhq/live-dmk-mobile";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import { TrackScreen } from "~/analytics";
import { SourceFlowProvider } from "../../utils/SourceFlowContext";
import { PAGE_CONNECT_DEVICE } from "../../utils/trackDeviceIntent";
import { ConnectingState } from "./ConnectingState";

jest.mock("~/analytics", () => {
  const actual = jest.requireActual("~/analytics");
  return {
    ...actual,
    TrackScreen: jest.fn(() => null),
  };
});

const mockedTrackScreen = jest.mocked(TrackScreen);

function makeKnownDevice(overrides: Partial<KnownDevice> = {}): KnownDevice {
  return {
    id: "device-id",
    name: "Ledger Nano X",
    deviceModelId: DeviceModelId.nanoX,
    transport: "ble" as KnownDevice["transport"],
    ...overrides,
  };
}

describe("ConnectingState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the connecting title", () => {
    render(
      <SourceFlowProvider value="my_ledger">
        <ConnectingState
          state={{ type: ConnectDeviceUIStateTypes.Connecting, device: makeKnownDevice() }}
        />
      </SourceFlowProvider>,
    );

    expect(screen.getByText("Loading")).toBeVisible();
  });

  it("GIVEN a device is connecting WHEN rendering THEN it tracks the Device UX V2 page event", () => {
    // GIVEN
    const device = makeKnownDevice();

    // WHEN
    render(
      <SourceFlowProvider value="my_ledger">
        <ConnectingState state={{ type: ConnectDeviceUIStateTypes.Connecting, device }} />
      </SourceFlowProvider>,
    );

    // THEN
    expect(mockedTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        category: PAGE_CONNECT_DEVICE.Connecting,
        sourceFlow: "my_ledger",
        modelId: DeviceModelId.nanoX,
        transport: "ble",
        deviceUxV2: true,
      }),
      undefined,
    );
  });
});
