import React from "react";
import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { Linking } from "react-native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceModelId as DMKDeviceModelId } from "@ledgerhq/device-management-kit";
import type { DeviceConnectionResult } from "@ledgerhq/device-intent";
import {
  connectDeviceUseCase,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
  rnBleTransportIdentifier,
  rnHidTransportIdentifier,
  useDeviceManagementKit,
} from "@ledgerhq/live-dmk-mobile";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import type { DeviceLike, State } from "~/reducers/types";
import { urls } from "~/utils/urls";
import { SourceFlowProvider, type SourceFlow } from "../utils/SourceFlowContext";
import { useDeviceConnectionComponentLWMViewModel } from "./useDeviceConnectionComponentLWMViewModel";

jest.mock("~/analytics", () => {
  const actual = jest.requireActual("~/analytics");
  return {
    ...actual,
    track: jest.fn(),
    screen: jest.fn(),
  };
});

const mockedTrack = jest.mocked(track);

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("@ledgerhq/live-dmk-mobile", () => {
  const actual = jest.requireActual("@ledgerhq/live-dmk-mobile");

  return {
    ...actual,
    connectDeviceUseCase: jest.fn(),
    useDeviceManagementKit: jest.fn(),
  };
});

type ConnectDeviceObserver = {
  next: (state: ConnectDeviceUIState) => void;
};

const mockedUseDeviceManagementKit = jest.mocked(useDeviceManagementKit);
const mockedConnectDeviceUseCase = jest.mocked(connectDeviceUseCase);
const mockedLinkingOpenURL = jest.mocked(Linking.openURL);
const mockDmk = { id: "dmk" } as unknown as NonNullable<ReturnType<typeof useDeviceManagementKit>>;

let connectDeviceObserver: ConnectDeviceObserver | undefined;
let mockUnsubscribe: jest.Mock;

type ViewModelStateParams = {
  knownDevices?: KnownDevice[];
  bleKnownDevices?: DeviceLike[];
  buyDeviceFromLiveEnabled?: boolean;
  myWalletEnabled?: boolean;
};

function mockConnectDeviceSubscription() {
  mockUnsubscribe = jest.fn();
  mockedConnectDeviceUseCase.mockReturnValue({
    subscribe: jest.fn((observer: ConnectDeviceObserver) => {
      connectDeviceObserver = observer;

      return { unsubscribe: mockUnsubscribe };
    }),
  } as unknown as ReturnType<typeof connectDeviceUseCase>);
}

function withViewModelState({
  knownDevices = [],
  bleKnownDevices = [],
  buyDeviceFromLiveEnabled,
  myWalletEnabled,
}: ViewModelStateParams = {}) {
  const featureFlagOverrides: Parameters<typeof withFlagOverrides>[0] = {
    ...(buyDeviceFromLiveEnabled === undefined
      ? {}
      : { buyDeviceFromLive: { enabled: buyDeviceFromLiveEnabled } }),
    ...(myWalletEnabled === undefined
      ? {}
      : { lwmWallet40: { enabled: myWalletEnabled, params: { myWallet: myWalletEnabled } } }),
  };

  return {
    overrideInitialState: withFlagOverrides(
      featureFlagOverrides,
      (state: State): State => ({
        ...state,
        knownDevices: { knownDevices },
        ble: {
          ...state.ble,
          knownDevices: bleKnownDevices,
        },
      }),
    ),
  };
}

const sourceFlow: SourceFlow = "my_ledger";

const layerABaseProperties = {
  deviceUxV2: true,
};

function SourceFlowWrapper({ children }: { children?: React.ReactNode }) {
  return <SourceFlowProvider value={sourceFlow}>{children}</SourceFlowProvider>;
}

function renderViewModel(callbacks = {}, stateParams?: ViewModelStateParams) {
  return renderHook(
    () =>
      useDeviceConnectionComponentLWMViewModel({
        onConnected: jest.fn(),
        ...callbacks,
      }),
    {
      ...withViewModelState(stateParams),
      innerWrapper: SourceFlowWrapper,
    },
  );
}

function makeKnownDevice(overrides: Partial<KnownDevice> = {}): KnownDevice {
  return {
    id: "known-device-id",
    name: "Known Ledger",
    deviceModelId: DeviceModelId.nanoX,
    transport: "ble" as KnownDevice["transport"],
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
    compatDeviceWired: false,
    connectedDevice: {
      id: "device-id",
      name: "Ledger Nano X",
      modelId: DMKDeviceModelId.NANO_X,
      sessionId: "session-id",
      type: "BLE",
      transport: "ble",
      ...connectedDeviceOverride,
    },
    ...resultOverrides,
  } as DeviceConnectionResult;
}

describe("useDeviceConnectionComponentLWMViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    connectDeviceObserver = undefined;
    mockUnsubscribe = jest.fn();
    mockedUseDeviceManagementKit.mockReturnValue(mockDmk);
    mockConnectDeviceSubscription();
  });

  it("should expose loading state and subscribe to the connect device use case with known devices", () => {
    // GIVEN
    const knownDevices = [makeKnownDevice()];

    // WHEN
    const { result } = renderViewModel({}, { knownDevices });

    // THEN
    expect(result.current.state).toEqual({ type: ConnectDeviceUIStateTypes.Loading });
    expect(mockedConnectDeviceUseCase).toHaveBeenCalledWith({
      knownDevices,
      dmk: mockDmk,
      onConnected: expect.any(Function),
    });
  });

  it("should update the state when the connect device use case emits", () => {
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

  it("should expose the UnknownError UI state when the use case emits it", () => {
    // GIVEN
    const error = new Error("boom");
    const { result } = renderViewModel();
    const unknownErrorState: ConnectDeviceUIState = {
      type: ConnectDeviceUIStateTypes.UnknownError,
      error,
    };

    // WHEN
    act(() => connectDeviceObserver?.next(unknownErrorState));

    // THEN
    expect(result.current.state).toBe(unknownErrorState);
  });

  it("should unsubscribe from the connect device use case on unmount", () => {
    // GIVEN
    const { unmount } = renderViewModel();

    // WHEN
    unmount();

    // THEN
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it("should throw when the Device Management Kit is not available so an ErrorBoundary can catch it", () => {
    // GIVEN
    mockedUseDeviceManagementKit.mockReturnValue(null);
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // THEN
    try {
      expect(() => renderViewModel()).toThrow("Device Management Kit is not available");
    } finally {
      consoleErrorSpy.mockRestore();
    }
    expect(mockedConnectDeviceUseCase).not.toHaveBeenCalled();
  });

  it("should navigate to My Ledger when connecting a Ledger device and My Wallet is disabled", () => {
    // GIVEN
    const { result } = renderViewModel();

    // WHEN
    act(() => result.current.onConnectLedgerDevice());

    // THEN
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.MyLedger, {
      state: {
        routes: [{ name: ScreenName.MyLedgerChooseDevice, params: undefined }],
      },
    });
  });

  it("should navigate to My Wallet when connecting a Ledger device and My Wallet is enabled", () => {
    // GIVEN
    const { result } = renderViewModel({}, { myWalletEnabled: true });

    // WHEN
    act(() => result.current.onConnectLedgerDevice());

    // THEN
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.MyWallet, {
      state: {
        routes: [{ name: ScreenName.MyWallet, params: undefined }],
      },
    });
  });

  it("should navigate to the buy device flow when buy device from Live is enabled", () => {
    // GIVEN
    const { result } = renderViewModel({}, { buyDeviceFromLiveEnabled: true });

    // WHEN
    act(() => result.current.onBuyLedgerDevice());

    // THEN
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.BuyDevice, {
      screen: ScreenName.PurchaseDevice,
    });
    expect(mockedLinkingOpenURL).not.toHaveBeenCalled();
  });

  it("should open the Ledger shop when buy device from Live is disabled", () => {
    // GIVEN
    const { result } = renderViewModel({}, { buyDeviceFromLiveEnabled: false });

    // WHEN
    act(() => result.current.onBuyLedgerDevice());

    // THEN
    expect(mockedLinkingOpenURL).toHaveBeenCalledWith(urls.buyNanoX);
    expect(mockNavigate).not.toHaveBeenCalledWith(NavigatorName.BuyDevice, expect.anything());
  });

  it("should open the Ledger shop when the buy device from Live feature flag uses its default state", () => {
    // GIVEN
    const { result } = renderViewModel();

    // WHEN
    act(() => result.current.onBuyLedgerDevice());

    // THEN
    expect(mockedLinkingOpenURL).toHaveBeenCalledWith(urls.buyNanoX);
    expect(mockNavigate).not.toHaveBeenCalledWith(NavigatorName.BuyDevice, expect.anything());
  });

  it("should persist a wired connected device and notify the caller", () => {
    // GIVEN
    const onConnected = jest.fn();
    const { store } = renderViewModel({ onConnected });
    const connectionResult = makeConnectionResult({
      compatDeviceWired: true,
      connectedDevice: {
        type: "USB",
        transport: "hid",
      } as unknown as DeviceConnectionResult["connectedDevice"],
    });
    const onConnectedFromUseCase = mockedConnectDeviceUseCase.mock.calls[0][0].onConnected;

    // WHEN
    act(() => onConnectedFromUseCase(connectionResult));

    // THEN
    expect(store.getState().settings.lastConnectedDevice).toEqual({
      deviceId: "device-id",
      deviceName: "Ledger Nano X",
      modelId: DeviceModelId.nanoX,
      wired: true,
    });
    expect(store.getState().appstate.hasConnectedDevice).toBe(true);
    expect(store.getState().knownDevices.knownDevices).toEqual([
      {
        id: "device-id",
        name: "Ledger Nano X",
        deviceModelId: DeviceModelId.nanoX,
        transport: "hid",
      },
    ]);
    expect(store.getState().ble.knownDevices).toEqual([]);
    expect(onConnected).toHaveBeenCalledWith(connectionResult);
  });

  it("should persist a BLE connected device in the BLE store and notify the caller", () => {
    // GIVEN
    const onConnected = jest.fn();
    const connectionResult = makeConnectionResult();
    const existingBleDevice: DeviceLike = {
      id: "device-id",
      name: "Ledger Nano X",
      modelId: DeviceModelId.nanoX,
    };
    const { store } = renderViewModel({ onConnected }, { bleKnownDevices: [existingBleDevice] });
    const onConnectedFromUseCase = mockedConnectDeviceUseCase.mock.calls[0][0].onConnected;

    // WHEN
    act(() => onConnectedFromUseCase(connectionResult));

    // THEN
    expect(store.getState().settings.lastConnectedDevice).toEqual({
      deviceId: "device-id",
      deviceName: "Ledger Nano X",
      modelId: DeviceModelId.nanoX,
      wired: false,
    });
    expect(store.getState().appstate.hasConnectedDevice).toBe(true);
    expect(store.getState().knownDevices.knownDevices).toEqual([
      {
        id: "device-id",
        name: "Ledger Nano X",
        deviceModelId: DeviceModelId.nanoX,
        transport: "ble",
      },
    ]);
    expect(store.getState().ble.knownDevices).toEqual([
      {
        id: "device-id",
        name: "Ledger Nano X",
        modelId: DeviceModelId.nanoX,
      },
    ]);
    expect(onConnected).toHaveBeenCalledWith(connectionResult);
  });

  describe("Layer A funnel events", () => {
    it("GIVEN the ViewModel mounts WHEN the hook initializes THEN it does not fire deviceflow_started", () => {
      // WHEN
      renderViewModel();

      // THEN
      const startedCalls = mockedTrack.mock.calls.filter(
        ([eventName]) => eventName === "deviceflow_started",
      );
      expect(startedCalls).toHaveLength(0);
    });

    describe("GIVEN the connect-device SM transitions to Discovering", () => {
      it("WHEN the state is observed THEN it fires device_prompted exactly once with the sourceFlow", () => {
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
            type: ConnectDeviceUIStateTypes.Discovering,
            devices: [],
          }),
        );

        // THEN
        const promptedCalls = mockedTrack.mock.calls.filter(
          ([eventName]) => eventName === "device_prompted",
        );
        expect(promptedCalls).toHaveLength(1);
        expect(promptedCalls[0]).toEqual([
          "device_prompted",
          { ...layerABaseProperties, sourceFlow: "my_ledger" },
        ]);
      });
    });

    describe("GIVEN the connect-device SM transitions to WaitingForSelectedDevice", () => {
      it("WHEN the state is observed THEN it fires device_prompted with the sourceFlow", () => {
        // GIVEN
        renderViewModel();
        const knownDevice = makeKnownDevice({ deviceModelId: DeviceModelId.stax });

        // WHEN
        act(() =>
          connectDeviceObserver?.next({
            type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice,
            device: knownDevice,
          }),
        );

        // THEN
        expect(mockedTrack).toHaveBeenCalledWith("device_prompted", {
          ...layerABaseProperties,
          sourceFlow: "my_ledger",
        });
      });
    });

    describe("GIVEN the connect-device SM transitions to Connecting", () => {
      it("WHEN the state is observed for a BLE known device THEN device_connecting fires with modelId and transport=ble carried by the state", () => {
        // GIVEN
        renderViewModel();

        // WHEN
        act(() =>
          connectDeviceObserver?.next({
            type: ConnectDeviceUIStateTypes.Connecting,
            device: makeKnownDevice({
              deviceModelId: DeviceModelId.stax,
              transport: rnBleTransportIdentifier,
            }),
          }),
        );

        // THEN
        expect(mockedTrack).toHaveBeenCalledWith("device_connecting", {
          ...layerABaseProperties,
          sourceFlow: "my_ledger",
          modelId: DeviceModelId.stax,
          transport: "ble",
          matchedDevice: DeviceModelId.stax,
        });
      });

      it("WHEN the state is observed for a USB known device THEN device_connecting fires with transport=usb", () => {
        // GIVEN
        renderViewModel();

        // WHEN
        act(() =>
          connectDeviceObserver?.next({
            type: ConnectDeviceUIStateTypes.Connecting,
            device: makeKnownDevice({
              deviceModelId: DeviceModelId.nanoX,
              transport: rnHidTransportIdentifier,
            }),
          }),
        );

        // THEN
        expect(mockedTrack).toHaveBeenCalledWith("device_connecting", {
          ...layerABaseProperties,
          sourceFlow: "my_ledger",
          modelId: DeviceModelId.nanoX,
          transport: "usb",
          matchedDevice: DeviceModelId.nanoX,
        });
      });
    });

    describe("GIVEN a connection completes", () => {
      it("WHEN wrappedOnConnected runs THEN it fires device_connected with the resolved modelId / transport for a BLE connection", () => {
        // GIVEN
        renderViewModel();
        const connectionResult = makeConnectionResult();
        const onConnectedFromUseCase = mockedConnectDeviceUseCase.mock.calls[0][0].onConnected;

        // WHEN
        act(() => onConnectedFromUseCase(connectionResult));

        // THEN
        expect(mockedTrack).toHaveBeenCalledWith("device_connected", {
          ...layerABaseProperties,
          sourceFlow: "my_ledger",
          modelId: DeviceModelId.nanoX,
          transport: "ble",
          matchedDevice: DeviceModelId.nanoX,
        });
      });

      it("WHEN wrappedOnConnected runs THEN it fires device_connected with transport=usb for a USB connection", () => {
        // GIVEN
        renderViewModel();
        const connectionResult = makeConnectionResult({
          connectedDevice: {
            type: "USB",
            transport: "hid",
          } as unknown as DeviceConnectionResult["connectedDevice"],
        });
        const onConnectedFromUseCase = mockedConnectDeviceUseCase.mock.calls[0][0].onConnected;

        // WHEN
        act(() => onConnectedFromUseCase(connectionResult));

        // THEN
        expect(mockedTrack).toHaveBeenCalledWith(
          "device_connected",
          expect.objectContaining({ transport: "usb" }),
        );
      });
    });
  });
});
