import React from "react";
import { track } from "@shared/analytics";
import { TrackScreen } from "@shared/analytics-react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  ConnectNewDeviceUIStateTypes,
  BaseDiscoveryErrorTypes,
  rnBleTransportIdentifier,
  type ConnectNewDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { DeviceIntentTrackingProvider } from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";
import type { State } from "~/reducers/types";
import { ConnectNewDeviceView } from "./ConnectNewDeviceView";
import type { ConnectNewDeviceNonErrorUIState } from "./types";

const mockedTrack = jest.mocked(track);
const mockedTrackScreen = jest.mocked(TrackScreen);

const device = {
  id: "device-id",
  name: "Ledger Nano X",
  deviceModelId: DeviceModelId.nanoX,
  transport: rnBleTransportIdentifier,
};

const discoveringState: ConnectNewDeviceNonErrorUIState = {
  type: ConnectNewDeviceUIStateTypes.Discovering,
  devices: [{ key: "nano-x", device, isAvailable: true, onSelect: jest.fn() }],
  scanningTransports: [rnBleTransportIdentifier],
  showDeviceNotFound: false,
};

const connectingState: ConnectNewDeviceUIState = {
  type: ConnectNewDeviceUIStateTypes.Connecting,
  device,
};

const withKnownNanoX = (state: State): State => ({
  ...state,
  knownDevices: { ...state.knownDevices, knownDevices: [device] },
});

const element = (viewState: ConnectNewDeviceUIState) => (
  <DeviceIntentTrackingProvider value={{ sourceFlow: "onboarding" }}>
    <ConnectNewDeviceView
      state={viewState}
      lastNonErrorState={discoveringState}
      platform="android"
      onCloseErrorSheet={jest.fn()}
    />
  </DeviceIntentTrackingProvider>
);

function renderView(
  state: ConnectNewDeviceUIState,
  overrideInitialState: (state: State) => State = initialState => initialState,
) {
  const view = render(element(state), { overrideInitialState });

  return {
    ...view,
    rerenderState: (viewState: ConnectNewDeviceUIState) => view.rerender(element(viewState)),
  };
}

const trackedEvents = (eventName: string) =>
  mockedTrack.mock.calls.filter(([name]) => name === eventName).map(([, properties]) => properties);

describe("ConnectNewDeviceView tracking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GIVEN discovery runs, WHEN the list shows again, THEN it should send device_prompted once with the scanning mode", () => {
    // GIVEN
    const { rerenderState } = renderView(discoveringState);

    // WHEN
    rerenderState({ ...discoveringState, devices: [] });

    // THEN
    expect(trackedEvents("device_prompted")).toEqual([
      { sourceFlow: "onboarding", deviceUxV2: true, scanningMode: "bluetooth" },
    ]);
    expect(mockedTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "Connect Device - Discovering",
        scanningMode: "bluetooth",
      }),
      undefined,
    );
  });

  it("GIVEN a device the app does not know, WHEN the user taps it, THEN it should send device_selected with isNewDevice true", async () => {
    // GIVEN
    const { user } = renderView(discoveringState);

    // WHEN
    await user.press(screen.getByRole("button", { name: /Ledger Nano X/ }));

    // THEN
    expect(trackedEvents("device_selected")).toEqual([
      {
        sourceFlow: "onboarding",
        deviceUxV2: true,
        modelId: DeviceModelId.nanoX,
        transport: "ble",
        isNewDevice: true,
      },
    ]);
  });

  it("GIVEN a known device, WHEN it connects twice, THEN it should send device_connecting at each connection with isNewDevice false", () => {
    // GIVEN
    const { rerenderState } = renderView(connectingState, withKnownNanoX);

    // WHEN
    rerenderState({ ...connectingState });
    rerenderState(discoveringState);
    rerenderState(connectingState);

    // THEN
    expect(trackedEvents("device_connecting")).toEqual([
      expect.objectContaining({
        modelId: DeviceModelId.nanoX,
        transport: "ble",
        isNewDevice: false,
      }),
      expect.objectContaining({
        modelId: DeviceModelId.nanoX,
        transport: "ble",
        isNewDevice: false,
      }),
    ]);
  });

  it("GIVEN the flow unmounts before a connection, WHEN it unmounts, THEN it should send deviceflow_aborted", () => {
    // GIVEN
    const { unmount } = renderView(discoveringState);

    // WHEN
    unmount();

    // THEN
    expect(trackedEvents("deviceflow_aborted")).toEqual([
      { sourceFlow: "onboarding", deviceUxV2: true },
    ]);
  });

  it("GIVEN a discovery error without retry, WHEN the flow unmounts on it, THEN it should send deviceflow_failed with the error", () => {
    // GIVEN
    const { unmount } = renderView({
      type: ConnectNewDeviceUIStateTypes.DiscoveryError,
      error: { type: BaseDiscoveryErrorTypes.Unknown },
      ignore: jest.fn(),
      close: jest.fn(),
    });

    // WHEN
    unmount();

    // THEN
    expect(trackedEvents("deviceflow_failed")).toEqual([
      {
        sourceFlow: "onboarding",
        deviceUxV2: true,
        failureType: "DiscoveryError",
        subError: "Unknown",
      },
    ]);
  });

  it("GIVEN the device connected, WHEN the flow unmounts, THEN it should send no outcome", () => {
    // GIVEN
    const { unmount } = renderView({ type: ConnectNewDeviceUIStateTypes.Connected, device });

    // WHEN
    unmount();

    // THEN
    expect(trackedEvents("deviceflow_aborted")).toEqual([]);
    expect(trackedEvents("deviceflow_failed")).toEqual([]);
  });
});
