import { TrackScreen } from "@shared/analytics-react";
import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import { DeviceIntentTrackingProvider } from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";
import { PAGE_CONNECT_DEVICE } from "LLM/components/DeviceIntentExecutor/utils/trackDeviceIntent";
import { TrackedConnectingState } from "./TrackedConnectingState";

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
      <DeviceIntentTrackingProvider value={{ sourceFlow: "my_ledger" }}>
        <TrackedConnectingState device={makeKnownDevice()} />
      </DeviceIntentTrackingProvider>,
    );

    expect(screen.getByText("Connecting to your Ledger device")).toBeVisible();
  });

  it("GIVEN a device is connecting WHEN rendering THEN it tracks the Device UX V2 page event", () => {
    // GIVEN
    const device = makeKnownDevice();

    // WHEN
    render(
      <DeviceIntentTrackingProvider value={{ sourceFlow: "my_ledger" }}>
        <TrackedConnectingState device={device} />
      </DeviceIntentTrackingProvider>,
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
