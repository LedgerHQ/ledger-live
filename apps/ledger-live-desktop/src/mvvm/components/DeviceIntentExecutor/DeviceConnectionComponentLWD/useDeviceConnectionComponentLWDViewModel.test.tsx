import type {
  DeviceConnectionComponentParams,
  DeviceConnectionResult,
} from "@features/platform-device-intent";
import {
  connectDevice,
  ConnectDeviceUIStateTypes,
  webHidTransportIdentifier,
  type ConnectDeviceUIState,
  useDeviceManagementKit,
} from "@ledgerhq/live-dmk-desktop";
import {
  DeviceIntentTrackingProvider,
  ledgerToDmkDeviceIdMap,
  type KnownDevice,
} from "@ledgerhq/live-dmk-shared";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { track } from "~/renderer/analytics/segment";
import type { State } from "~/renderer/reducers";
import createStore, { type ReduxStore } from "~/state-manager/configureStore";

import { useDeviceConnectionComponentLWDViewModel } from "./useDeviceConnectionComponentLWDViewModel";

const mockHandleConnect = jest.fn();
const mockHandleBuyDevice = jest.fn();

jest.mock("LLD/hooks/useLazyOnboardingActions", () => ({
  useLazyOnboardingActions: () => ({
    handleConnect: mockHandleConnect,
    handleBuyDevice: mockHandleBuyDevice,
  }),
}));

jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
}));

jest.mock("@ledgerhq/live-dmk-desktop", () => {
  const actual = jest.requireActual("@ledgerhq/live-dmk-desktop");

  return {
    ...actual,
    connectDevice: jest.fn(),
    useDeviceManagementKit: jest.fn(),
  };
});

type ConnectDeviceObserver = {
  next: (state: ConnectDeviceUIState) => void;
};

const mockedUseDeviceManagementKit = jest.mocked(useDeviceManagementKit);
const mockedConnectDevice = jest.mocked(connectDevice);
const mockedTrack = jest.mocked(track);
const mockDmk = { id: "dmk" } as unknown as NonNullable<ReturnType<typeof useDeviceManagementKit>>;

let connectDeviceObserver: ConnectDeviceObserver | undefined;
let mockUnsubscribe: jest.Mock;

const defaultDeviceConnectionParams: DeviceConnectionComponentParams = {
  acceptedDeviceModelIds: [],
  disableAutoConnect: false,
};

const layerABaseProperties = {
  deviceUxV2: true,
  sourceFlow: "swap",
};

function mockConnectDeviceSubscription() {
  mockUnsubscribe = jest.fn();
  mockedConnectDevice.mockReturnValue({
    subscribe: jest.fn((observer: ConnectDeviceObserver) => {
      connectDeviceObserver = observer;

      return { unsubscribe: mockUnsubscribe };
    }),
  } as unknown as ReturnType<typeof connectDevice>);
}

function renderViewModel({
  knownDevices = [],
  deviceConnectionParams = defaultDeviceConnectionParams,
  onConnected = jest.fn(),
}: {
  knownDevices?: KnownDevice[];
  deviceConnectionParams?: DeviceConnectionComponentParams;
  onConnected?: (connectionResult: DeviceConnectionResult) => void;
} = {}) {
  const store = createStore({
    state: {
      knownDevices: { knownDevices },
    } as State,
    fetchRemoteFlags: null,
  });

  const rendered = renderHook(
    () =>
      useDeviceConnectionComponentLWDViewModel({
        deviceConnectionParams,
        onConnected,
      }),
    {
      wrapper: ({ children }) => <TestWrapper store={store}>{children}</TestWrapper>,
    },
  );

  return { ...rendered, store };
}

function TestWrapper({ children, store }: { children: React.ReactNode; store: ReduxStore }) {
  return (
    <Provider store={store}>
      <MemoryRouter>
        <DeviceIntentTrackingProvider value={{ sourceFlow: "swap" }}>
          {children}
        </DeviceIntentTrackingProvider>
      </MemoryRouter>
    </Provider>
  );
}

function makeKnownDevice(overrides: Partial<KnownDevice> = {}): KnownDevice {
  return {
    id: "",
    name: "Known Ledger",
    deviceModelId: DeviceModelId.nanoX,
    transport: webHidTransportIdentifier,
    ...overrides,
  };
}

function makeConnectionResult(
  overrides: Partial<DeviceConnectionResult> = {},
): DeviceConnectionResult {
  const { connectedDevice: connectedDeviceOverride, ...resultOverrides } = overrides;

  return {
    compatDeviceId: "device-id",
    compatDeviceName: "Ledger Nano X",
    compatDeviceWired: true,
    dmk: mockDmk,
    sessionId: "session-id",
    connectedDevice: {
      id: "device-id",
      name: "Ledger Nano X",
      modelId: ledgerToDmkDeviceIdMap[DeviceModelId.nanoX],
      sessionId: "session-id",
      type: "USB",
      transport: webHidTransportIdentifier,
      ...connectedDeviceOverride,
    },
    ...resultOverrides,
  } as DeviceConnectionResult;
}

describe("useDeviceConnectionComponentLWDViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    connectDeviceObserver = undefined;
    mockUnsubscribe = jest.fn();
    mockedUseDeviceManagementKit.mockReturnValue(mockDmk);
    mockConnectDeviceSubscription();
  });

  it("GIVEN known devices WHEN rendering the view model THEN it exposes loading state and subscribes to connect device", () => {
    // GIVEN
    const knownDevices = [makeKnownDevice()];

    // WHEN
    const { result } = renderViewModel({ knownDevices });

    // THEN
    expect(result.current.state).toEqual({ type: ConnectDeviceUIStateTypes.Loading });
    expect(mockedConnectDevice).toHaveBeenCalledWith({
      knownDevices,
      acceptedDeviceModelIds: [],
      disableAutoConnect: false,
      dmk: mockDmk,
      onConnected: expect.any(Function),
    });
  });

  it("GIVEN accepted device model ids WHEN rendering the view model THEN it passes them to connect device", () => {
    // GIVEN
    const acceptedDeviceModelIds = [ledgerToDmkDeviceIdMap[DeviceModelId.stax]];

    // WHEN
    renderViewModel({
      deviceConnectionParams: { acceptedDeviceModelIds, disableAutoConnect: false },
    });

    // THEN
    expect(mockedConnectDevice).toHaveBeenCalledWith(
      expect.objectContaining({
        acceptedDeviceModelIds: [DeviceModelId.stax],
      }),
    );
  });

  it("GIVEN the executor suppressed auto-connect WHEN rendering the view model THEN it passes that to connect device", () => {
    // WHEN
    renderViewModel({
      deviceConnectionParams: { acceptedDeviceModelIds: [], disableAutoConnect: true },
    });

    // THEN
    expect(mockedConnectDevice).toHaveBeenCalledWith(
      expect.objectContaining({ disableAutoConnect: true }),
    );
  });

  it("GIVEN the connect device flow emits a state WHEN observing the flow THEN it updates the view model state", () => {
    // GIVEN
    const { result } = renderViewModel();
    const discoveringState: ConnectDeviceUIState = {
      type: ConnectDeviceUIStateTypes.Discovering,
      devices: [],
    };

    // WHEN
    act(() => connectDeviceObserver?.next(discoveringState));

    // THEN
    expect(result.current.state).toBe(discoveringState);
  });

  describe("GIVEN the Connect Device flow emits tracking states", () => {
    it("WHEN Discovering and WaitingForSelectedDevice are observed THEN device_prompted fires once", () => {
      // GIVEN
      renderViewModel();

      // WHEN
      act(() =>
        connectDeviceObserver?.next({
          type: ConnectDeviceUIStateTypes.Discovering,
          devices: [],
        }),
      );
      act(() =>
        connectDeviceObserver?.next({
          type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice,
          device: makeKnownDevice(),
        }),
      );

      // THEN
      expect(mockedTrack).toHaveBeenCalledTimes(1);
      expect(mockedTrack).toHaveBeenCalledWith("device_prompted", layerABaseProperties);
    });

    it("WHEN Connecting is observed repeatedly THEN device_connecting fires once with USB properties", () => {
      // GIVEN
      renderViewModel();
      const connectingState: ConnectDeviceUIState = {
        type: ConnectDeviceUIStateTypes.Connecting,
        device: makeKnownDevice({ deviceModelId: DeviceModelId.stax }),
      };

      // WHEN
      act(() => connectDeviceObserver?.next(connectingState));
      act(() => connectDeviceObserver?.next(connectingState));

      // THEN
      expect(mockedTrack).toHaveBeenCalledTimes(1);
      expect(mockedTrack).toHaveBeenCalledWith("device_connecting", {
        ...layerABaseProperties,
        modelId: DeviceModelId.stax,
        transport: "usb",
        matchedDevice: DeviceModelId.stax,
      });
    });

    it("WHEN a device connection succeeds THEN device_connected carries the model and USB transport", () => {
      // GIVEN
      renderViewModel();
      const connectionResult = makeConnectionResult();
      const wrappedOnConnected = mockedConnectDevice.mock.calls[0][0].onConnected;

      // WHEN
      act(() => wrappedOnConnected(connectionResult));

      // THEN
      expect(mockedTrack).toHaveBeenCalledWith("device_connected", {
        ...layerABaseProperties,
        modelId: DeviceModelId.nanoX,
        transport: "usb",
        matchedDevice: DeviceModelId.nanoX,
      });
    });
  });

  it("GIVEN the view model is subscribed WHEN unmounting THEN it unsubscribes from connect device", () => {
    // GIVEN
    const { unmount } = renderViewModel();

    // WHEN
    unmount();

    // THEN
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it("GIVEN a connection flow WHEN known devices change THEN it keeps the existing subscription", () => {
    // GIVEN
    const { store } = renderViewModel();

    // WHEN
    act(() => {
      store.dispatch({
        type: "ADD_DEVICE",
        payload: {
          deviceId: "",
          modelId: DeviceModelId.nanoX,
          wired: true,
        },
      });
    });

    // THEN
    expect(mockedConnectDevice).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribe).not.toHaveBeenCalled();
  });

  it("GIVEN connect device reports a connection WHEN handling the result THEN it updates desktop device state and notifies the executor", () => {
    // GIVEN
    const onConnected = jest.fn();
    const { store } = renderViewModel({ onConnected });
    const connectionResult = makeConnectionResult();
    const wrappedOnConnected = mockedConnectDevice.mock.calls[0][0].onConnected;

    // WHEN
    act(() => wrappedOnConnected(connectionResult));

    // THEN
    expect(onConnected).toHaveBeenCalledWith(connectionResult);
    expect(store.getState().settings.devicesModelList).toContain(DeviceModelId.nanoX);
  });

  it("GIVEN desktop onboarding actions are available WHEN calling no-known-device handlers THEN it forwards to onboarding actions", () => {
    // GIVEN
    const { result } = renderViewModel();

    // WHEN
    result.current.onConnectLedgerDevice();
    result.current.onBuyLedgerDevice();

    // THEN
    expect(mockHandleConnect).toHaveBeenCalledTimes(1);
    expect(mockHandleBuyDevice).toHaveBeenCalledTimes(1);
  });

  it("GIVEN Device Management Kit is unavailable WHEN rendering the view model THEN it exposes an unknown error state", async () => {
    // GIVEN
    mockedUseDeviceManagementKit.mockReturnValue(null);

    // WHEN
    const { result } = renderViewModel();

    // THEN
    await waitFor(() =>
      expect(result.current.state).toEqual({
        type: ConnectDeviceUIStateTypes.UnknownError,
        error: expect.objectContaining({
          message: "Device Management Kit is not available",
        }),
      }),
    );
    expect(mockedConnectDevice).not.toHaveBeenCalled();
  });
});
