import type { DeviceConnectionParams, DeviceConnectionResult } from "@ledgerhq/device-intent";
import {
  connectDevice,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
  useDeviceManagementKit,
} from "@ledgerhq/live-dmk-desktop";
import { ledgerToDmkDeviceIdMap, type KnownDevice } from "@ledgerhq/live-dmk-shared";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import type { State } from "~/renderer/reducers";
import { WEB_HID_TRANSPORT_IDENTIFIER } from "~/renderer/reducers/knownDevices";
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
const mockDmk = { id: "dmk" } as unknown as NonNullable<ReturnType<typeof useDeviceManagementKit>>;

let connectDeviceObserver: ConnectDeviceObserver | undefined;
let mockUnsubscribe: jest.Mock;

const defaultDeviceConnectionParams: DeviceConnectionParams = {
  acceptedDeviceModelIds: [],
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
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  );
}

function makeKnownDevice(overrides: Partial<KnownDevice> = {}): KnownDevice {
  return {
    id: "",
    name: "Known Ledger",
    deviceModelId: DeviceModelId.nanoX,
    transport: WEB_HID_TRANSPORT_IDENTIFIER,
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
    compatDeviceModelId: DeviceModelId.nanoX,
    compatDeviceWired: true,
    dmk: mockDmk,
    sessionId: "session-id",
    connectedDevice: {
      id: "device-id",
      name: "Ledger Nano X",
      modelId: ledgerToDmkDeviceIdMap[DeviceModelId.nanoX],
      sessionId: "session-id",
      type: "USB",
      transport: WEB_HID_TRANSPORT_IDENTIFIER,
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

  it("should expose loading state and subscribe to the connect device flow with known devices", () => {
    const knownDevices = [makeKnownDevice()];

    const { result } = renderViewModel({ knownDevices });

    expect(result.current.state).toEqual({ type: ConnectDeviceUIStateTypes.Loading });
    expect(mockedConnectDevice).toHaveBeenCalledWith({
      knownDevices,
      acceptedDeviceModelIds: [],
      dmk: mockDmk,
      onConnected: expect.any(Function),
    });
  });

  it("should pass accepted device model ids to the connect device flow", () => {
    const acceptedDeviceModelIds = [DeviceModelId.stax];

    renderViewModel({
      deviceConnectionParams: { acceptedDeviceModelIds },
    });

    expect(mockedConnectDevice).toHaveBeenCalledWith(
      expect.objectContaining({
        acceptedDeviceModelIds,
      }),
    );
  });

  it("should update the state when the connect device flow emits", () => {
    const { result } = renderViewModel();
    const discoveringState: ConnectDeviceUIState = {
      type: ConnectDeviceUIStateTypes.Discovering,
      devices: [],
    };

    act(() => connectDeviceObserver?.next(discoveringState));

    expect(result.current.state).toBe(discoveringState);
  });

  it("should unsubscribe from the connect device flow when unmounted", () => {
    const { unmount } = renderViewModel();

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it("should update desktop device state and notify the executor when connected", () => {
    const onConnected = jest.fn();
    const { store } = renderViewModel({ onConnected });
    const connectionResult = makeConnectionResult();
    const wrappedOnConnected = mockedConnectDevice.mock.calls[0][0].onConnected;

    act(() => wrappedOnConnected(connectionResult));

    expect(onConnected).toHaveBeenCalledWith(connectionResult);
    expect(store.getState().devices.currentDevice).toEqual({
      deviceId: "device-id",
      deviceName: "Ledger Nano X",
      modelId: DeviceModelId.nanoX,
      wired: true,
    });
    expect(store.getState().settings.devicesModelList).toContain(DeviceModelId.nanoX);
    expect(store.getState().knownDevices.knownDevices).toEqual([
      {
        transport: WEB_HID_TRANSPORT_IDENTIFIER,
        deviceModelId: DeviceModelId.nanoX,
        id: "",
        name: "Ledger Nano X",
      },
    ]);
  });

  it("should expose desktop onboarding actions for no-known-device CTAs", () => {
    const { result } = renderViewModel();

    result.current.onConnectLedgerDevice();
    result.current.onBuyLedgerDevice();

    expect(mockHandleConnect).toHaveBeenCalledTimes(1);
    expect(mockHandleBuyDevice).toHaveBeenCalledTimes(1);
  });

  it("should throw when Device Management Kit is unavailable", () => {
    mockedUseDeviceManagementKit.mockReturnValue(null);

    expect(() => renderViewModel()).toThrow("Device Management Kit is not available");
  });
});
