import { act, renderHook } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceModelId as DMKDeviceModelId } from "@ledgerhq/device-management-kit";
import {
  BaseConnectionErrorTypes,
  BaseDiscoveryErrorTypes,
  connectNewDevice,
  ConnectNewDeviceUIStateTypes,
  rnBleTransportIdentifier,
  useDeviceManagementKit,
  type ConnectNewDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import type { DeviceConnectionResult } from "@ledgerhq/live-dmk-shared";
import type { ConnectNewDeviceProps } from "./types";
import { useConnectNewDeviceViewModel } from "./useConnectNewDeviceViewModel";

jest.mock("@ledgerhq/live-dmk-mobile", () => {
  const actual = jest.requireActual("@ledgerhq/live-dmk-mobile");

  return {
    ...actual,
    connectNewDevice: jest.fn(),
    useDeviceManagementKit: jest.fn(),
  };
});

type ConnectNewDeviceObserver = {
  next: (state: ConnectNewDeviceUIState) => void;
};

const mockedUseDeviceManagementKit = jest.mocked(useDeviceManagementKit);
const mockedConnectNewDevice = jest.mocked(connectNewDevice);
const mockDmk = { id: "dmk" } as unknown as NonNullable<ReturnType<typeof useDeviceManagementKit>>;

let observer: ConnectNewDeviceObserver | undefined;
let mockUnsubscribe: jest.Mock;

const device = {
  id: "device-id",
  name: "Ledger Nano X",
  deviceModelId: DeviceModelId.nanoX,
  transport: rnBleTransportIdentifier,
};

const discoveringState: ConnectNewDeviceUIState = {
  type: ConnectNewDeviceUIStateTypes.Discovering,
  devices: [{ device, onSelect: jest.fn() }],
  scanningTransports: [rnBleTransportIdentifier],
  showDeviceNotFound: false,
};

function makeDiscoveryErrorState(close = jest.fn()): ConnectNewDeviceUIState {
  return {
    type: ConnectNewDeviceUIStateTypes.DiscoveryError,
    error: { type: BaseDiscoveryErrorTypes.Unknown },
    ignore: jest.fn(),
    close,
  };
}

function makeConnectionErrorState(close = jest.fn()): ConnectNewDeviceUIState {
  return {
    type: ConnectNewDeviceUIStateTypes.ConnectionError,
    error: { type: BaseConnectionErrorTypes.Unknown },
    device,
    retry: jest.fn(),
    ignore: jest.fn(),
    close,
  };
}

function makeConnectionResult(): DeviceConnectionResult {
  return {
    dmk: mockDmk,
    sessionId: "session-id",
    compatDeviceId: "device-id",
    compatDeviceName: "Ledger Nano X",
    compatDeviceWired: false,
    connectedDevice: {
      id: "device-id",
      name: "Ledger Nano X",
      modelId: DMKDeviceModelId.NANO_X,
      sessionId: "session-id",
      type: "BLE",
      transport: "ble",
    } as DeviceConnectionResult["connectedDevice"],
  };
}

function emit(state: ConnectNewDeviceUIState) {
  act(() => observer?.next(state));
}

function useCaseInput() {
  return mockedConnectNewDevice.mock.calls[0][0];
}

function renderViewModel(props: Partial<ConnectNewDeviceProps> = {}) {
  const allProps: ConnectNewDeviceProps = {
    onConnected: jest.fn(),
    onDeviceNotFound: jest.fn(),
    onClose: jest.fn(),
    ...props,
  };

  return { ...renderHook(() => useConnectNewDeviceViewModel(allProps)), props: allProps };
}

describe("useConnectNewDeviceViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    observer = undefined;
    mockUnsubscribe = jest.fn();
    mockedUseDeviceManagementKit.mockReturnValue(mockDmk);
    mockedConnectNewDevice.mockReturnValue({
      subscribe: jest.fn((nextObserver: ConnectNewDeviceObserver) => {
        observer = nextObserver;
        return { unsubscribe: mockUnsubscribe };
      }),
    } as unknown as ReturnType<typeof connectNewDevice>);
  });

  it("should start the use case once with the DMK and the delays", () => {
    // GIVEN / WHEN
    renderViewModel({ delays: { deviceNotFound: 10, success: 20 } });

    // THEN
    expect(mockedConnectNewDevice).toHaveBeenCalledTimes(1);
    expect(useCaseInput()).toEqual(
      expect.objectContaining({ dmk: mockDmk, deviceNotFoundDelay: 10, successDelay: 20 }),
    );
  });

  it("should unsubscribe from the use case on unmount", () => {
    // GIVEN
    const { unmount } = renderViewModel();

    // WHEN
    unmount();

    // THEN
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it("should not restart the use case when the callbacks change", () => {
    // GIVEN
    const onClose = jest.fn();
    let props: ConnectNewDeviceProps = {
      onConnected: jest.fn(),
      onDeviceNotFound: jest.fn(),
      onClose: jest.fn(),
    };
    const { rerender } = renderHook(() => useConnectNewDeviceViewModel(props));

    // WHEN
    props = { ...props, onClose };
    rerender({});
    act(() => useCaseInput().onClose());

    // THEN
    expect(mockedConnectNewDevice).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should keep the current state and the last non-error state", () => {
    // GIVEN
    const { result } = renderViewModel();
    const errorState = makeDiscoveryErrorState();

    // WHEN
    emit(discoveringState);
    emit(errorState);

    // THEN
    expect(result.current.state).toBe(errorState);
    expect(result.current.lastNonErrorState).toBe(discoveringState);
  });

  it("should save the connected device, then call onConnected", () => {
    // GIVEN
    const { props, store } = renderViewModel();
    const connectionResult = makeConnectionResult();

    // WHEN
    act(() => useCaseInput().onConnected(connectionResult));

    // THEN
    expect(store.getState().settings.lastConnectedDevice).toEqual({
      deviceId: "device-id",
      deviceName: "Ledger Nano X",
      modelId: DeviceModelId.nanoX,
      wired: false,
    });
    expect(props.onConnected).toHaveBeenCalledWith(connectionResult);
  });

  it("should call onClose when the use case closes", () => {
    // GIVEN
    const { props } = renderViewModel();

    // WHEN
    act(() => useCaseInput().onClose());

    // THEN
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it.each([
    { name: "discovery error", makeState: makeDiscoveryErrorState },
    { name: "connection error", makeState: makeConnectionErrorState },
  ])(
    "GIVEN a $name WHEN the error sheet closes THEN it calls the state's close",
    ({ makeState }) => {
      // GIVEN
      const close = jest.fn();
      const { result, props } = renderViewModel();
      emit(makeState(close));

      // WHEN
      act(() => result.current.onCloseErrorSheet());

      // THEN
      expect(close).toHaveBeenCalledTimes(1);
      expect(props.onClose).not.toHaveBeenCalled();
    },
  );

  it("GIVEN an unknown error WHEN the error sheet closes THEN it calls onClose", () => {
    // GIVEN
    const { result, props } = renderViewModel();
    emit({ type: ConnectNewDeviceUIStateTypes.UnknownError, error: new Error("boom") });

    // WHEN
    act(() => result.current.onCloseErrorSheet());

    // THEN
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("should pass onDeviceNotFound through", () => {
    // GIVEN
    const { result, props } = renderViewModel();

    // WHEN
    act(() => result.current.onDeviceNotFound());

    // THEN
    expect(props.onDeviceNotFound).toHaveBeenCalledTimes(1);
  });
});
