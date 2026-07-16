import type { DeviceConnectionParams, DeviceConnectionResult } from "@ledgerhq/device-intent";
import {
  connectDevice,
  ConnectDeviceUIStateTypes,
  webHidTransportIdentifier,
  type ConnectDeviceUIState,
  useDeviceManagementKit,
} from "@ledgerhq/live-dmk-desktop";
import { ledgerToDmkDeviceIdMap, type KnownDevice } from "@ledgerhq/live-dmk-shared";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
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
      dmk: mockDmk,
      onConnected: expect.any(Function),
    });
  });

  it("GIVEN accepted device model ids WHEN rendering the view model THEN it passes them to connect device", () => {
    // GIVEN
    const acceptedDeviceModelIds = [DeviceModelId.stax];

    // WHEN
    renderViewModel({
      deviceConnectionParams: { acceptedDeviceModelIds },
    });

    // THEN
    expect(mockedConnectDevice).toHaveBeenCalledWith(
      expect.objectContaining({
        acceptedDeviceModelIds,
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

  it("GIVEN the view model is subscribed WHEN unmounting THEN it unsubscribes from connect device", () => {
    // GIVEN
    const { unmount } = renderViewModel();

    // WHEN
    unmount();

    // THEN
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
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
