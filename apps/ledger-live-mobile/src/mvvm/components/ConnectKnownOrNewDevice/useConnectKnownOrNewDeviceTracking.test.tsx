import React from "react";
import { track } from "@shared/analytics";
import { renderHook } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  BaseDiscoveryErrorTypes,
  ConnectKnownOrNewDeviceUIStateTypes,
  ConnectNewDeviceUIStateTypes,
  rnBleTransportIdentifier,
  type ConnectKnownOrNewDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { DeviceIntentTrackingProvider } from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";
import { useConnectKnownOrNewDeviceTracking } from "./useConnectKnownOrNewDeviceTracking";

const device = {
  id: "device-id",
  name: "Ledger Nano X",
  deviceModelId: DeviceModelId.nanoX,
  transport: rnBleTransportIdentifier,
};

const listState: ConnectKnownOrNewDeviceUIState = {
  type: ConnectKnownOrNewDeviceUIStateTypes.Discovering,
  isPaused: false,
  devices: [],
  addNewDevice: jest.fn(),
};

type AddModeUIState = Extract<
  ConnectKnownOrNewDeviceUIState,
  { type: typeof ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice }
>["connectNewDeviceUIState"];

const addMode = (connectNewDeviceUIState: AddModeUIState): ConnectKnownOrNewDeviceUIState => ({
  type: ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice,
  connectNewDeviceUIState,
  close: jest.fn(),
});

const addModeDiscovering = addMode({
  type: ConnectNewDeviceUIStateTypes.Discovering,
  devices: [],
  scanningTransports: [rnBleTransportIdentifier],
  showDeviceNotFound: false,
});

const TrackingProvider = ({ children }: { children?: React.ReactNode }) => (
  <DeviceIntentTrackingProvider value={{ sourceFlow: "my_wallet" }}>
    {children}
  </DeviceIntentTrackingProvider>
);

function renderTracking(initialState: ConnectKnownOrNewDeviceUIState) {
  let listUIState = initialState;
  const { rerender, unmount } = renderHook(() => useConnectKnownOrNewDeviceTracking(listUIState), {
    innerWrapper: TrackingProvider,
  });

  return {
    unmount,
    showState: (state: ConnectKnownOrNewDeviceUIState) => {
      listUIState = state;
      rerender(undefined);
    },
  };
}

const outcomes = () =>
  jest
    .mocked(track)
    .mock.calls.filter(([name]) => name === "deviceflow_aborted" || name === "deviceflow_failed");

describe("useConnectKnownOrNewDeviceTracking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GIVEN the Add mode, WHEN the list leaves it before a connection, THEN it should send deviceflow_aborted", () => {
    // GIVEN
    const { showState } = renderTracking(addModeDiscovering);

    // WHEN
    showState(listState);

    // THEN
    expect(outcomes()).toEqual([
      ["deviceflow_aborted", { sourceFlow: "my_wallet", deviceUxV2: true }],
    ]);
  });

  it("GIVEN an error in the Add mode, WHEN the list unmounts, THEN it should send deviceflow_failed with the error", () => {
    // GIVEN
    const { unmount } = renderTracking(
      addMode({
        type: ConnectNewDeviceUIStateTypes.DiscoveryError,
        error: { type: BaseDiscoveryErrorTypes.Unknown },
        ignore: jest.fn(),
        close: jest.fn(),
      }),
    );

    // WHEN
    unmount();

    // THEN
    expect(outcomes()).toEqual([
      [
        "deviceflow_failed",
        {
          sourceFlow: "my_wallet",
          deviceUxV2: true,
          failureType: "DiscoveryError",
          subError: "Unknown",
        },
      ],
    ]);
  });

  it("GIVEN the Add mode shows Connected, WHEN the list leaves it, THEN it should send no outcome", () => {
    // GIVEN
    const { showState } = renderTracking(
      addMode({ type: ConnectNewDeviceUIStateTypes.Connected, device }),
    );

    // WHEN
    showState(listState);

    // THEN
    expect(outcomes()).toEqual([]);
  });

  it("GIVEN the Add mode, WHEN a fatal error shows the unknown error of the list, THEN it should send no outcome", () => {
    // GIVEN
    const { showState } = renderTracking(addModeDiscovering);

    // WHEN
    showState({ type: ConnectKnownOrNewDeviceUIStateTypes.UnknownError, error: new Error("boom") });

    // THEN
    expect(outcomes()).toEqual([]);
  });
});
