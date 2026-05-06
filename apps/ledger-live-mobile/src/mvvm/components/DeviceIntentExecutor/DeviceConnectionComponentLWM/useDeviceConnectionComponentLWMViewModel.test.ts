import { act, renderHook } from "@testing-library/react-native";
import { Linking } from "react-native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { DeviceConnectionResult } from "@ledgerhq/device-intent";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  connectDeviceUseCase,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
  useDeviceManagementKit,
} from "@ledgerhq/live-dmk-mobile";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import { setHasConnectedDevice } from "~/actions/appstate";
import { setLastConnectedDevice } from "~/actions/settings";
import { updateKnownBleDevice } from "~/actions/ble";
import { NavigatorName, ScreenName } from "~/const";
import { updateKnownDevice } from "~/reducers/knownDevices";
import { urls } from "~/utils/urls";
import { useDeviceConnectionComponentLWMViewModel } from "./useDeviceConnectionComponentLWMViewModel";

const mockNavigate = jest.fn();
const mockDispatch = jest.fn();
let mockKnownDevices: KnownDevice[] = [];

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("~/context/hooks", () => ({
  useDispatch: () => mockDispatch,
  useSelector: jest.fn(selector =>
    selector({
      knownDevices: { knownDevices: mockKnownDevices },
    }),
  ),
}));

jest.mock("@ledgerhq/live-common/featureFlags/index", () => ({
  useFeature: jest.fn(),
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

const mockedUseFeature = jest.mocked(useFeature);
const mockedUseDeviceManagementKit = jest.mocked(useDeviceManagementKit);
const mockedConnectDeviceUseCase = jest.mocked(connectDeviceUseCase);
const mockedLinkingOpenURL = jest.mocked(Linking.openURL);
const mockDmk = { id: "dmk" } as unknown as NonNullable<
  ReturnType<typeof useDeviceManagementKit>
>;

let connectDeviceObserver: ConnectDeviceObserver | undefined;
let mockUnsubscribe: jest.Mock;

function mockConnectDeviceSubscription() {
  mockUnsubscribe = jest.fn();
  mockedConnectDeviceUseCase.mockReturnValue({
    subscribe: jest.fn((observer: ConnectDeviceObserver) => {
      connectDeviceObserver = observer;

      return { unsubscribe: mockUnsubscribe };
    }),
  } as unknown as ReturnType<typeof connectDeviceUseCase>);
}

function renderViewModel(callbacks = {}) {
  return renderHook(() =>
    useDeviceConnectionComponentLWMViewModel({
      onConnected: jest.fn(),
      onError: jest.fn(),
      ...callbacks,
    }),
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
  return {
    compatDeviceId: "device-id",
    compatDeviceName: "Ledger Nano X",
    compatDeviceModelId: DeviceModelId.nanoX,
    compatDeviceWired: false,
    connectedDevice: {
      transport: "ble",
    },
    ...overrides,
  } as DeviceConnectionResult;
}

describe("useDeviceConnectionComponentLWMViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockKnownDevices = [];
    connectDeviceObserver = undefined;
    mockUnsubscribe = jest.fn();
    mockedUseFeature.mockReturnValue(null);
    mockedUseDeviceManagementKit.mockReturnValue(mockDmk);
    mockConnectDeviceSubscription();
  });

  it("should expose loading state and subscribe to the connect device use case with known devices", () => {
    mockKnownDevices = [makeKnownDevice()];

    const { result } = renderViewModel();

    expect(result.current.state).toEqual({ type: ConnectDeviceUIStateTypes.Loading });
    expect(mockedConnectDeviceUseCase).toHaveBeenCalledWith({
      knownDevices: mockKnownDevices,
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

  it("should navigate to the BLE pairing flow when connecting a Ledger device", () => {
    const { result } = renderViewModel();

    act(() => result.current.onConnectLedgerDevice());

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.BleDevicePairingFlow);
  });

  it("should navigate to the buy device flow when buy device from Live is enabled", () => {
    mockedUseFeature.mockReturnValue({ enabled: true } as ReturnType<typeof useFeature>);
    const { result } = renderViewModel();

    act(() => result.current.onBuyLedgerDevice());

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.BuyDevice, {
      screen: ScreenName.PurchaseDevice,
    });
    expect(mockedLinkingOpenURL).not.toHaveBeenCalled();
  });

  it("should open the Ledger shop when buy device from Live is disabled", () => {
    mockedUseFeature.mockReturnValue({ enabled: false } as ReturnType<typeof useFeature>);
    const { result } = renderViewModel();

    act(() => result.current.onBuyLedgerDevice());

    expect(mockedLinkingOpenURL).toHaveBeenCalledWith(urls.buyNanoX);
    expect(mockNavigate).not.toHaveBeenCalledWith(NavigatorName.BuyDevice, expect.anything());
  });

  it("should open the Ledger shop when the buy device from Live feature flag is missing", () => {
    mockedUseFeature.mockReturnValue(null);
    const { result } = renderViewModel();

    act(() => result.current.onBuyLedgerDevice());

    expect(mockedLinkingOpenURL).toHaveBeenCalledWith(urls.buyNanoX);
    expect(mockNavigate).not.toHaveBeenCalledWith(NavigatorName.BuyDevice, expect.anything());
  });

  it("should persist a wired connected device and notify the caller", () => {
    const onConnected = jest.fn();
    renderViewModel({ onConnected });
    const connectionResult = makeConnectionResult({
      compatDeviceWired: true,
      connectedDevice: {
        transport: "hid",
      } as unknown as DeviceConnectionResult["connectedDevice"],
    });
    const onConnectedFromUseCase = mockedConnectDeviceUseCase.mock.calls[0][0].onConnected;

    act(() => onConnectedFromUseCase(connectionResult));

    expect(mockDispatch).toHaveBeenNthCalledWith(
      1,
      setLastConnectedDevice({
        deviceId: "device-id",
        deviceName: "Ledger Nano X",
        modelId: DeviceModelId.nanoX,
        wired: true,
      }),
    );
    expect(mockDispatch).toHaveBeenNthCalledWith(2, setHasConnectedDevice(true));
    expect(mockDispatch).toHaveBeenNthCalledWith(
      3,
      updateKnownDevice({
        id: "device-id",
        name: "Ledger Nano X",
        deviceModelId: DeviceModelId.nanoX,
        transport: "hid",
      }),
    );
    expect(mockDispatch).toHaveBeenCalledTimes(3);
    expect(onConnected).toHaveBeenCalledWith(connectionResult);
  });

  it("should persist a BLE connected device in the BLE store and notify the caller", () => {
    const onConnected = jest.fn();
    renderViewModel({ onConnected });
    const connectionResult = makeConnectionResult();
    const onConnectedFromUseCase = mockedConnectDeviceUseCase.mock.calls[0][0].onConnected;

    act(() => onConnectedFromUseCase(connectionResult));

    expect(mockDispatch).toHaveBeenNthCalledWith(
      4,
      updateKnownBleDevice({
        id: "device-id",
        name: "Ledger Nano X",
        modelId: DeviceModelId.nanoX,
      }),
    );
    expect(mockDispatch).toHaveBeenCalledTimes(4);
    expect(onConnected).toHaveBeenCalledWith(connectionResult);
  });
});
