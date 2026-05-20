import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { Linking } from "react-native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceModelId as DMKDeviceModelId } from "@ledgerhq/device-management-kit";
import type { DeviceConnectionResult } from "@ledgerhq/device-intent";
import {
  connectDeviceUseCase,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
  useDeviceManagementKit,
} from "@ledgerhq/live-dmk-mobile";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import { NavigatorName, ScreenName } from "~/const";
import type { DeviceLike, State } from "~/reducers/types";
import { urls } from "~/utils/urls";
import { useDeviceConnectionComponentLWMViewModel } from "./useDeviceConnectionComponentLWMViewModel";

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
  error: (error: unknown) => void;
};

const mockedUseDeviceManagementKit = jest.mocked(useDeviceManagementKit);
const mockedConnectDeviceUseCase = jest.mocked(connectDeviceUseCase);
const mockedLinkingOpenURL = jest.mocked(Linking.openURL);
const mockDmk = { id: "dmk" } as unknown as NonNullable<
  ReturnType<typeof useDeviceManagementKit>
>;

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

function renderViewModel(callbacks = {}, stateParams?: ViewModelStateParams) {
  return renderHook(
    () =>
      useDeviceConnectionComponentLWMViewModel({
        onConnected: jest.fn(),
        onError: jest.fn(),
        ...callbacks,
      }),
    withViewModelState(stateParams),
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
    const knownDevices = [makeKnownDevice()];

    const { result } = renderViewModel({}, { knownDevices });

    expect(result.current.state).toEqual({ type: ConnectDeviceUIStateTypes.Loading });
    expect(mockedConnectDeviceUseCase).toHaveBeenCalledWith({
      knownDevices,
      dmk: mockDmk,
      onConnected: expect.any(Function),
    });
  });

  it("should update the state when the connect device use case emits", () => {
    const { result } = renderViewModel();
    const discoveringState: ConnectDeviceUIState = {
      type: ConnectDeviceUIStateTypes.Discovering,
      devices: [],
    };

    act(() => connectDeviceObserver?.next(discoveringState));

    expect(result.current.state).toBe(discoveringState);
  });

  it("should forward connect device use case errors", () => {
    const onError = jest.fn();
    const error = new Error("Discovery failed");
    renderViewModel({ onError });

    act(() => connectDeviceObserver?.error(error));

    expect(onError).toHaveBeenCalledWith(error);
  });

  it("should unsubscribe from the connect device use case on unmount", () => {
    const { unmount } = renderViewModel();

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it("should report an error when the Device Management Kit is not available", () => {
    const onError = jest.fn();
    mockedUseDeviceManagementKit.mockReturnValue(null);

    renderViewModel({ onError });

    expect(onError).toHaveBeenCalledWith(new Error("Device Management Kit is not available"));
    expect(mockedConnectDeviceUseCase).not.toHaveBeenCalled();
  });

  it("should navigate to My Ledger when connecting a Ledger device and My Wallet is disabled", () => {
    const { result } = renderViewModel();

    act(() => result.current.onConnectLedgerDevice());

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.MyLedger, {
      state: {
        routes: [{ name: ScreenName.MyLedgerChooseDevice, params: undefined }],
      },
    });
  });

  it("should navigate to My Wallet when connecting a Ledger device and My Wallet is enabled", () => {
    const { result } = renderViewModel({}, { myWalletEnabled: true });

    act(() => result.current.onConnectLedgerDevice());

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.MyWallet, {
      state: {
        routes: [{ name: ScreenName.MyWallet, params: undefined }],
      },
    });
  });

  it("should navigate to the buy device flow when buy device from Live is enabled", () => {
    const { result } = renderViewModel({}, { buyDeviceFromLiveEnabled: true });

    act(() => result.current.onBuyLedgerDevice());

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.BuyDevice, {
      screen: ScreenName.PurchaseDevice,
    });
    expect(mockedLinkingOpenURL).not.toHaveBeenCalled();
  });

  it("should open the Ledger shop when buy device from Live is disabled", () => {
    const { result } = renderViewModel({}, { buyDeviceFromLiveEnabled: false });

    act(() => result.current.onBuyLedgerDevice());

    expect(mockedLinkingOpenURL).toHaveBeenCalledWith(urls.buyNanoX);
    expect(mockNavigate).not.toHaveBeenCalledWith(NavigatorName.BuyDevice, expect.anything());
  });

  it("should open the Ledger shop when the buy device from Live feature flag uses its default state", () => {
    const { result } = renderViewModel();

    act(() => result.current.onBuyLedgerDevice());

    expect(mockedLinkingOpenURL).toHaveBeenCalledWith(urls.buyNanoX);
    expect(mockNavigate).not.toHaveBeenCalledWith(NavigatorName.BuyDevice, expect.anything());
  });

  it("should persist a wired connected device and notify the caller", () => {
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

    act(() => onConnectedFromUseCase(connectionResult));

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
    const onConnected = jest.fn();
    const connectionResult = makeConnectionResult();
    const existingBleDevice: DeviceLike = {
      id: "device-id",
      name: "Ledger Nano X",
      modelId: DeviceModelId.nanoX,
    };
    const { store } = renderViewModel(
      { onConnected },
      { bleKnownDevices: [existingBleDevice] },
    );
    const onConnectedFromUseCase = mockedConnectDeviceUseCase.mock.calls[0][0].onConnected;

    act(() => onConnectedFromUseCase(connectionResult));

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
});
