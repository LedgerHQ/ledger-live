import type {
  DeviceConnectionParams,
  DeviceConnectionResult,
} from "@features/platform-device-intent";
import {
  BaseConnectionErrorTypes,
  connectDevice,
  ConnectDeviceUIStateTypes,
  isBluetoothTransportEnabled,
  requestBluetoothDevice,
  webBleTransportIdentifier,
  webHidTransportIdentifier,
  type ConnectDeviceUIState,
  useDeviceManagementKit,
} from "@ledgerhq/live-dmk-desktop";
import type { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import {
  DeviceIntentTrackingProvider,
  ledgerToDmkDeviceIdMap,
  type KnownDevice,
} from "@ledgerhq/live-dmk-shared";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { track } from "@shared/analytics";
import { getEnvDefault, setEnv } from "@shared/env";
import type { State } from "~/renderer/reducers";
import createStore, { type ReduxStore } from "~/state-manager/configureStore";
import { recordBluetoothSelection } from "~/renderer/components/Bluetooth/bluetoothSelection";

import { useConnectionViewModel } from "./useConnectionViewModel";

const mockHandleConnect = jest.fn();
const mockReportFailure = jest.fn();
const mockHandleBuyDevice = jest.fn();

jest.mock("LLD/hooks/useLazyOnboardingActions", () => ({
  useLazyOnboardingActions: () => ({
    handleConnect: mockHandleConnect,
    handleBuyDevice: mockHandleBuyDevice,
  }),
}));

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(),
}));

jest.mock("@ledgerhq/live-dmk-desktop", () => {
  const actual = jest.requireActual("@ledgerhq/live-dmk-desktop");

  return {
    ...actual,
    connectDevice: jest.fn(),
    isBluetoothTransportEnabled: jest.fn(),
    requestBluetoothDevice: jest.fn(),
    useDeviceManagementKit: jest.fn(),
  };
});

type ConnectDeviceObserver = {
  next: (state: ConnectDeviceUIState) => void;
};

const mockedUseDeviceManagementKit = jest.mocked(useDeviceManagementKit);
const mockedConnectDevice = jest.mocked(connectDevice);
const mockedIsBluetoothTransportEnabled = jest.mocked(isBluetoothTransportEnabled);
const mockedRequestBluetoothDevice = jest.mocked(requestBluetoothDevice);
const mockedTrack = jest.mocked(track);
const mockDmk = { id: "dmk" } as unknown as ReturnType<typeof useDeviceManagementKit>;

let connectDeviceObserver: ConnectDeviceObserver | undefined;
let mockUnsubscribe: jest.Mock;

const defaultDeviceConnectionParams: DeviceConnectionParams = {
  acceptedDeviceModelIds: [],
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
  deviceConnectionParams?: DeviceConnectionParams;
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
      useConnectionViewModel({
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
        <DeviceIntentTrackingProvider
          value={{ sourceFlow: "swap", reportFailure: mockReportFailure }}
        >
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

describe("useConnectionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    connectDeviceObserver = undefined;
    mockUnsubscribe = jest.fn();
    mockedUseDeviceManagementKit.mockReturnValue(mockDmk);
    mockedIsBluetoothTransportEnabled.mockReturnValue(false);
    setEnv("MOCK_SERVER_TRANSPORT", false);
    mockConnectDeviceSubscription();
  });

  afterEach(() => {
    setEnv("MOCK_SERVER_TRANSPORT", getEnvDefault("MOCK_SERVER_TRANSPORT"));
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
      dmk: mockDmk,
      onConnected: expect.any(Function),
      mockServerTransportEnabled: false,
    });
  });

  it("GIVEN the mock server transport is enabled WHEN rendering THEN connect device receives that flag", () => {
    setEnv("MOCK_SERVER_TRANSPORT", true);

    renderViewModel();

    expect(mockedConnectDevice).toHaveBeenCalledWith(
      expect.objectContaining({ mockServerTransportEnabled: true }),
    );
  });

  it("GIVEN accepted device model ids WHEN rendering the view model THEN it passes them to connect device", () => {
    // GIVEN
    const acceptedDeviceModelIds = [ledgerToDmkDeviceIdMap[DeviceModelId.stax]];

    // WHEN
    renderViewModel({
      deviceConnectionParams: { acceptedDeviceModelIds },
    });

    // THEN
    expect(mockedConnectDevice).toHaveBeenCalledWith(
      expect.objectContaining({
        acceptedDeviceModelIds: [DeviceModelId.stax],
      }),
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

  describe("failure reporting", () => {
    const unknownConnectionErrorState: ConnectDeviceUIState = {
      type: ConnectDeviceUIStateTypes.ConnectionError,
      error: {
        type: BaseConnectionErrorTypes.Unknown,
        error: { _tag: "OpeningConnectionError" },
      },
      device: makeKnownDevice(),
      retry: jest.fn(),
      ignore: jest.fn(),
    };

    it("should report an unknown connection error as a failure when it is displayed", () => {
      renderViewModel();

      act(() => {
        connectDeviceObserver?.next(unknownConnectionErrorState);
      });

      expect(mockReportFailure).toHaveBeenLastCalledWith(
        expect.objectContaining({
          failureType: "ConnectionError",
          countsAsFailure: true,
          subError: "OpeningConnectionError",
          modelId: DeviceModelId.nanoX,
        }),
      );
    });

    it("should clear the reported failure when the flow leaves the error state", () => {
      renderViewModel();
      act(() => {
        connectDeviceObserver?.next(unknownConnectionErrorState);
      });

      act(() => {
        connectDeviceObserver?.next({
          type: ConnectDeviceUIStateTypes.Connecting,
          device: makeKnownDevice(),
        });
      });

      expect(mockReportFailure).toHaveBeenLastCalledWith(null);
    });
  });
  describe("Bluetooth", () => {
    const chooserDeviceId = "chooser-device-id";
    const discoveredFlex = {
      id: "dmk-device-id",
      name: "Flex 1A2B",
      deviceModel: { model: ledgerToDmkDeviceIdMap[DeviceModelId.europa] },
      transport: webBleTransportIdentifier,
    } as unknown as DiscoveredDevice;

    beforeEach(() => {
      mockedIsBluetoothTransportEnabled.mockReturnValue(true);
    });

    it("GIVEN the Bluetooth transport is disabled WHEN rendering THEN it exposes no Bluetooth action", () => {
      mockedIsBluetoothTransportEnabled.mockReturnValue(false);

      const { result } = renderViewModel();

      expect(result.current.bluetooth).toBeNull();
    });

    it("GIVEN only models without Bluetooth are accepted WHEN rendering THEN it exposes no Bluetooth action", () => {
      const { result } = renderViewModel({
        deviceConnectionParams: {
          acceptedDeviceModelIds: [ledgerToDmkDeviceIdMap[DeviceModelId.nanoSP]],
        },
      });

      expect(result.current.bluetooth).toBeNull();
    });

    it("GIVEN any model is accepted WHEN rendering THEN it exposes an idle Bluetooth action", () => {
      const { result } = renderViewModel();

      expect(result.current.bluetooth).toEqual({ status: "idle", onConnect: expect.any(Function) });
    });

    it("GIVEN a Bluetooth device is picked WHEN it is remembered THEN connect device restarts with it", async () => {
      mockedRequestBluetoothDevice.mockImplementation(async () => {
        recordBluetoothSelection({ type: "selected", deviceId: chooserDeviceId });
        return discoveredFlex;
      });
      const knownUsbDevice = makeKnownDevice();
      const { result } = renderViewModel({ knownDevices: [knownUsbDevice] });

      await act(() => result.current.bluetooth?.onConnect());

      const rememberedFlex = {
        transport: webBleTransportIdentifier,
        id: chooserDeviceId,
        deviceModelId: DeviceModelId.europa,
        name: "Flex 1A2B",
      };
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
      expect(mockedConnectDevice).toHaveBeenCalledTimes(2);
      expect(mockedConnectDevice).toHaveBeenLastCalledWith(
        expect.objectContaining({ knownDevices: [knownUsbDevice, rememberedFlex] }),
      );
    });

    it("GIVEN the Bluetooth device is already known WHEN it is picked again THEN connect device keeps running", async () => {
      mockedRequestBluetoothDevice.mockImplementation(async () => {
        recordBluetoothSelection({ type: "selected", deviceId: chooserDeviceId });
        return discoveredFlex;
      });
      const { result } = renderViewModel({
        knownDevices: [
          makeKnownDevice({
            transport: webBleTransportIdentifier,
            id: chooserDeviceId,
            deviceModelId: DeviceModelId.europa,
          }),
        ],
      });

      await act(() => result.current.bluetooth?.onConnect());

      expect(mockedConnectDevice).toHaveBeenCalledTimes(1);
      expect(mockUnsubscribe).not.toHaveBeenCalled();
    });

    it("GIVEN the user cancels the chooser WHEN connecting THEN it reports the cancellation", async () => {
      mockedRequestBluetoothDevice.mockImplementation(async () => {
        recordBluetoothSelection({ type: "cancelled" });
        throw new Error("User cancelled");
      });
      const { result } = renderViewModel();

      await act(() => result.current.bluetooth?.onConnect());

      expect(result.current.bluetooth?.status).toBe("cancelled");
      expect(mockedConnectDevice).toHaveBeenCalledTimes(1);
    });
  });
});
