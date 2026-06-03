import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { getDeviceModel } from "@ledgerhq/devices";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import { TrackScreen } from "~/analytics";
import { ConnectDeviceUIStateTypes, type ConnectDeviceUIState } from "@ledgerhq/live-dmk-mobile";
import { SourceFlowProvider } from "../../utils/SourceFlowContext";
import { PAGE_CONNECT_DEVICE } from "../../utils/trackDeviceIntent";
import { WaitingForSelectedDeviceState } from "./WaitingForSelectedDeviceState";

jest.mock("~/analytics", () => {
  const actual = jest.requireActual("~/analytics");
  return {
    ...actual,
    TrackScreen: jest.fn(() => null),
  };
});

const mockedTrackScreen = jest.mocked(TrackScreen);

type WaitingForSelectedDeviceUIState = Extract<
  ConnectDeviceUIState,
  { type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice }
>;

function makeKnownDevice(overrides: Partial<KnownDevice> = {}): KnownDevice {
  return {
    id: "device-id",
    name: "Ledger Nano X",
    deviceModelId: DeviceModelId.nanoX,
    transport: "ble" as KnownDevice["transport"],
    ...overrides,
  };
}

function renderState(device: KnownDevice) {
  const state: WaitingForSelectedDeviceUIState = {
    type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice,
    device,
  };

  return render(
    <SourceFlowProvider value="my_ledger">
      <WaitingForSelectedDeviceState state={state} />
    </SourceFlowProvider>,
  );
}

describe("WaitingForSelectedDeviceState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the selected device name and product-specific title", () => {
    renderState(makeKnownDevice({ name: "My Ledger" }));

    expect(screen.getByText("My Ledger")).toBeVisible();
    expect(
      screen.getByText(
        `Power on and unlock your ${getDeviceModel(DeviceModelId.nanoX).productName}`,
      ),
    ).toBeVisible();
  });

  it("should render the fallback device name when the selected device has no name", () => {
    renderState(makeKnownDevice({ name: null }));

    expect(screen.getByText("Ledger device")).toBeVisible();
  });

  it("GIVEN a selected device WHEN rendering THEN it tracks the Device UX V2 page event", () => {
    // GIVEN
    const device = makeKnownDevice();

    // WHEN
    renderState(device);

    // THEN
    expect(mockedTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        category: PAGE_CONNECT_DEVICE.WaitingForSelectedDevice,
        sourceFlow: "my_ledger",
        modelId: DeviceModelId.nanoX,
        deviceUxV2: true,
      }),
      undefined,
    );
  });
});
