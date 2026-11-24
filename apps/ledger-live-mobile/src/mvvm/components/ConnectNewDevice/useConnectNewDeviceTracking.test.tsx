import React from "react";
import { track } from "@shared/analytics";
import { renderHook } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  BaseDiscoveryErrorTypes,
  ConnectNewDeviceUIStateTypes,
  rnBleTransportIdentifier,
  type ConnectNewDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import type { State } from "~/reducers/types";
import { DeviceIntentTrackingProvider } from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";
import { useConnectNewDeviceTracking } from "./useConnectNewDeviceTracking";

const device = {
  id: "device-id",
  name: "Ledger Nano X",
  deviceModelId: DeviceModelId.nanoX,
  transport: rnBleTransportIdentifier,
};

const discoveryNotStarted: ConnectNewDeviceUIState = {
  type: ConnectNewDeviceUIStateTypes.Discovering,
  devices: [],
  scanningTransports: [],
  showDeviceNotFound: false,
};

const discovering: ConnectNewDeviceUIState = {
  type: ConnectNewDeviceUIStateTypes.Discovering,
  devices: [],
  scanningTransports: [rnBleTransportIdentifier],
  showDeviceNotFound: false,
};

const connecting: ConnectNewDeviceUIState = {
  type: ConnectNewDeviceUIStateTypes.Connecting,
  device,
};

const discoveryError: ConnectNewDeviceUIState = {
  type: ConnectNewDeviceUIStateTypes.DiscoveryError,
  error: { type: BaseDiscoveryErrorTypes.Unknown },
  ignore: jest.fn(),
  close: jest.fn(),
};

const withKnownNanoX = (state: State): State => ({
  ...state,
  knownDevices: { ...state.knownDevices, knownDevices: [device] },
});

const TrackingProvider = ({ children }: { children?: React.ReactNode }) => (
  <DeviceIntentTrackingProvider value={{ sourceFlow: "onboarding" }}>
    {children}
  </DeviceIntentTrackingProvider>
);

function renderTracking(
  initialState: ConnectNewDeviceUIState,
  {
    overrideInitialState = state => state,
    reportsOutcome = true,
  }: { overrideInitialState?: (state: State) => State; reportsOutcome?: boolean } = {},
) {
  let uiState = initialState;
  const { rerender, unmount } = renderHook(
    () => useConnectNewDeviceTracking(uiState, { reportsOutcome }),
    { innerWrapper: TrackingProvider, overrideInitialState },
  );

  return {
    unmount,
    showState: (state: ConnectNewDeviceUIState) => {
      uiState = state;
      rerender(undefined);
    },
  };
}

const eventsNamed = (eventName: string) =>
  jest.mocked(track).mock.calls.filter(([name]) => name === eventName);

const outcomes = () =>
  jest
    .mocked(track)
    .mock.calls.filter(([name]) => name === "deviceflow_aborted" || name === "deviceflow_failed");

const devicePrompted = [
  "device_prompted",
  { sourceFlow: "onboarding", deviceUxV2: true, scanningMode: "bluetooth" },
];

const aborted = ["deviceflow_aborted", { sourceFlow: "onboarding", deviceUxV2: true }];

const failedOnDiscoveryError = [
  "deviceflow_failed",
  {
    sourceFlow: "onboarding",
    deviceUxV2: true,
    failureType: "DiscoveryError",
    subError: "Unknown",
  },
];

describe("useConnectNewDeviceTracking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GIVEN discovery runs, WHEN the list shows again, THEN it should send device_prompted once with the scanning mode", () => {
    // GIVEN
    const { showState } = renderTracking(discovering);

    // WHEN
    showState({ ...discovering });

    // THEN
    expect(eventsNamed("device_prompted")).toEqual([devicePrompted]);
  });

  it("GIVEN discovery has not started, WHEN it starts, THEN it should send device_prompted only then", () => {
    // GIVEN
    const { showState } = renderTracking(discoveryNotStarted);
    expect(eventsNamed("device_prompted")).toEqual([]);

    // WHEN
    showState(discovering);

    // THEN
    expect(eventsNamed("device_prompted")).toEqual([devicePrompted]);
  });

  it("GIVEN a known device, WHEN it connects twice, THEN it should send device_connecting at each connection with isNewDevice false", () => {
    // GIVEN
    const { showState } = renderTracking(connecting, { overrideInitialState: withKnownNanoX });

    // WHEN
    showState({ ...connecting });
    showState(discovering);
    showState(connecting);

    // THEN
    const deviceConnecting = [
      "device_connecting",
      {
        sourceFlow: "onboarding",
        deviceUxV2: true,
        modelId: DeviceModelId.nanoX,
        transport: "ble",
        matchedDevice: DeviceModelId.nanoX,
        isNewDevice: false,
      },
    ];
    expect(eventsNamed("device_connecting")).toEqual([deviceConnecting, deviceConnecting]);
  });

  it("GIVEN discovery runs, WHEN the flow unmounts before a connection, THEN it should send deviceflow_aborted", () => {
    // GIVEN
    const { unmount } = renderTracking(discovering);

    // WHEN
    unmount();

    // THEN
    expect(outcomes()).toEqual([aborted]);
  });

  it("GIVEN a discovery error without retry, WHEN the flow unmounts on it, THEN it should send deviceflow_failed with the error", () => {
    // GIVEN
    const { unmount } = renderTracking(discoveryError);

    // WHEN
    unmount();

    // THEN
    expect(outcomes()).toEqual([failedOnDiscoveryError]);
  });

  it("GIVEN a discovery error without retry, WHEN the user closes it and the flow ends, THEN it should send deviceflow_failed with the error", () => {
    // GIVEN
    const { showState, unmount } = renderTracking(discoveryError);

    // WHEN
    showState({ type: ConnectNewDeviceUIStateTypes.Terminated });
    unmount();

    // THEN
    expect(outcomes()).toEqual([failedOnDiscoveryError]);
  });

  it.each([
    ["discovery runs again", discovering],
    ["a device connects", connecting],
  ])(
    "GIVEN a discovery error, WHEN %s and the flow unmounts, THEN it should send deviceflow_aborted without the error",
    (_, nextState) => {
      // GIVEN
      const { showState, unmount } = renderTracking(discoveryError);

      // WHEN
      showState(nextState);
      unmount();

      // THEN
      expect(outcomes()).toEqual([aborted]);
    },
  );

  it("GIVEN a flow that does not report its outcome, as in the Add mode, WHEN it unmounts before a connection, THEN it should send no outcome", () => {
    // GIVEN
    const { unmount } = renderTracking(discovering, { reportsOutcome: false });

    // WHEN
    unmount();

    // THEN
    expect(outcomes()).toEqual([]);
  });

  it("GIVEN the device connected, WHEN the flow unmounts, THEN it should send no outcome", () => {
    // GIVEN
    const { unmount } = renderTracking({ type: ConnectNewDeviceUIStateTypes.Connected, device });

    // WHEN
    unmount();

    // THEN
    expect(outcomes()).toEqual([]);
  });
});
