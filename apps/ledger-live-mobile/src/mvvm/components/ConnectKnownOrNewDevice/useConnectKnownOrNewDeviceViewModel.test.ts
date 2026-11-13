import { act, renderHook } from "@tests/test-renderer";
import { AppState, BackHandler, type AppStateStatus } from "react-native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceModelId as DMKDeviceModelId } from "@ledgerhq/device-management-kit";
import {
  BaseDiscoveryErrorTypes,
  connectKnownOrNewDevice,
  ConnectKnownOrNewDeviceUIStateTypes,
  ConnectNewDeviceUIStateTypes,
  DeviceListItemStatuses,
  rnBleTransportIdentifier,
  useDeviceManagementKit,
  type ConnectKnownOrNewDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import type { DeviceConnectionResult, KnownDevice } from "@ledgerhq/live-dmk-shared";
import type { State } from "~/reducers/types";
import type { ConnectKnownOrNewDeviceProps } from "./types";
import { useConnectKnownOrNewDeviceViewModel } from "./useConnectKnownOrNewDeviceViewModel";

jest.mock("@ledgerhq/live-dmk-mobile", () => {
  const actual = jest.requireActual("@ledgerhq/live-dmk-mobile");

  return {
    ...actual,
    connectKnownOrNewDevice: jest.fn(),
    useDeviceManagementKit: jest.fn(),
  };
});

const mockIsFocused = jest.fn(() => true);
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => mockIsFocused(),
}));

const mockedConnectKnownOrNewDevice = jest.mocked(connectKnownOrNewDevice);
const mockDmk = { id: "dmk" } as unknown as NonNullable<ReturnType<typeof useDeviceManagementKit>>;

const knownNanoX: KnownDevice = {
  id: "nano-x-id",
  name: "My Nano X",
  deviceModelId: DeviceModelId.nanoX,
  transport: rnBleTransportIdentifier,
};

const nanoXRow = {
  key: "known:nano-x",
  device: knownNanoX,
  connectivity: "BLE" as const,
  status: DeviceListItemStatuses.Unavailable,
};

const discoveringState: ConnectKnownOrNewDeviceUIState = {
  type: ConnectKnownOrNewDeviceUIStateTypes.Discovering,
  devices: [{ ...nanoXRow, connect: jest.fn() }],
  addNewDevice: jest.fn(),
};

const makeConnectionResult = (): DeviceConnectionResult => ({
  dmk: mockDmk,
  sessionId: "session-id",
  compatDeviceId: "nano-x-id",
  compatDeviceName: "Nano X 1A2B",
  compatDeviceWired: false,
  connectedDevice: {
    id: "nano-x-id",
    name: "Nano X 1A2B",
    modelId: DMKDeviceModelId.NANO_X,
    sessionId: "session-id",
    type: "BLE",
    transport: rnBleTransportIdentifier,
  } as DeviceConnectionResult["connectedDevice"],
});

const makeAddModeState = (close = jest.fn()): ConnectKnownOrNewDeviceUIState => ({
  type: ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice,
  connectNewDeviceUIState: {
    type: ConnectNewDeviceUIStateTypes.Discovering,
    devices: [],
    scanningTransports: [rnBleTransportIdentifier],
    showDeviceNotFound: false,
  },
  close,
});

let emitters: Array<(state: ConnectKnownOrNewDeviceUIState) => void> = [];
let unsubscribes: Array<jest.Mock> = [];
const mockPause = jest.fn();
const mockResume = jest.fn();

function emit(state: ConnectKnownOrNewDeviceUIState) {
  act(() => emitters[emitters.length - 1]?.(state));
}

function lastInput() {
  return mockedConnectKnownOrNewDevice.mock.calls[
    mockedConnectKnownOrNewDevice.mock.calls.length - 1
  ][0];
}

const withKnownNanoX =
  (lastConnectedDeviceId: string) =>
  (state: State): State => ({
    ...state,
    knownDevices: { knownDevices: [knownNanoX] },
    ble: {
      knownDevices: [{ id: "nano-x-id", name: "My Nano X", modelId: DeviceModelId.nanoX }],
    },
    settings: {
      ...state.settings,
      lastConnectedDevice: {
        deviceId: lastConnectedDeviceId,
        deviceName: "My Nano X",
        modelId: DeviceModelId.nanoX,
        wired: false,
      },
    },
  });

function setup(
  props: Partial<ConnectKnownOrNewDeviceProps> = {},
  overrideInitialState: (state: State) => State = state => state,
) {
  const initialProps: ConnectKnownOrNewDeviceProps = {
    onConnected: jest.fn(),
    onAddModeChange: jest.fn(),
    isPaused: false,
    ...props,
  };
  let currentProps = initialProps;
  const rendered = renderHook(() => useConnectKnownOrNewDeviceViewModel(currentProps), {
    overrideInitialState,
  });
  const rerender = (nextProps: Partial<ConnectKnownOrNewDeviceProps>) => {
    currentProps = { ...initialProps, ...nextProps };
    rendered.rerender({});
  };

  return { ...rendered, initialProps, rerender };
}

describe("useConnectKnownOrNewDeviceViewModel", () => {
  let appStateListener: ((state: AppStateStatus) => void) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    emitters = [];
    unsubscribes = [];
    mockIsFocused.mockReturnValue(true);
    jest.mocked(useDeviceManagementKit).mockReturnValue(mockDmk);
    jest.spyOn(AppState, "addEventListener").mockImplementation((_, listener) => {
      appStateListener = listener;
      return { remove: jest.fn() };
    });
    mockedConnectKnownOrNewDevice.mockImplementation(() => ({
      uiStates: {
        subscribe: jest.fn(({ next }) => {
          emitters.push(next);
          const unsubscribe = jest.fn();
          unsubscribes.push(unsubscribe);
          return { unsubscribe };
        }),
      } as unknown as ReturnType<typeof connectKnownOrNewDevice>["uiStates"],
      pause: mockPause,
      resume: mockResume,
    }));
  });

  describe("Pause and resume", () => {
    it("should start the flow paused when isPaused is true", () => {
      setup({ isPaused: true });

      expect(lastInput().isPaused).toBe(true);
    });

    it("should pause when isPaused becomes true and resume when it becomes false", () => {
      const { rerender } = setup();

      rerender({ isPaused: true });
      expect(mockPause).toHaveBeenCalledTimes(1);
      rerender({ isPaused: false });

      expect(mockResume).toHaveBeenCalledTimes(2);
    });

    it("should pause when the screen is not focused and resume when it is focused again", () => {
      const { rerender } = setup();
      mockResume.mockClear();

      mockIsFocused.mockReturnValue(false);
      rerender({});
      expect(mockPause).toHaveBeenCalledTimes(1);
      mockIsFocused.mockReturnValue(true);
      rerender({});

      expect(mockResume).toHaveBeenCalledTimes(1);
    });

    it("should pause when the app goes to the background and resume when it comes back", () => {
      setup();
      mockResume.mockClear();

      act(() => appStateListener?.("background"));
      expect(mockPause).toHaveBeenCalledTimes(1);
      act(() => appStateListener?.("active"));

      expect(mockResume).toHaveBeenCalledTimes(1);
    });

    it("should stay paused while the screen is not focused when isPaused becomes false", () => {
      const { rerender } = setup({ isPaused: true });
      mockIsFocused.mockReturnValue(false);
      rerender({ isPaused: true });
      mockResume.mockClear();

      rerender({ isPaused: false });

      expect(mockResume).not.toHaveBeenCalled();
    });
  });

  describe("Restart", () => {
    it("should start a new flow when the unknown error is closed", () => {
      const { result } = setup();
      emit({ type: ConnectKnownOrNewDeviceUIStateTypes.UnknownError, error: new Error("boom") });

      act(() => result.current.onCloseErrorSheet());

      expect(mockedConnectKnownOrNewDevice).toHaveBeenCalledTimes(2);
      expect(unsubscribes[0]).toHaveBeenCalledTimes(1);
    });

    it("should keep the rows of the last list under the unknown error", () => {
      const { result } = setup();
      emit(discoveringState);

      emit({ type: ConnectKnownOrNewDeviceUIStateTypes.UnknownError, error: new Error("boom") });

      expect(result.current.devices).toEqual(discoveringState.devices);
    });

    it("should close a discovery error when its sheet closes", () => {
      const { result } = setup();
      const close = jest.fn();
      emit({
        type: ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError,
        devices: [nanoXRow],
        error: { type: BaseDiscoveryErrorTypes.Unknown },
        ignore: jest.fn(),
        close,
      });

      act(() => result.current.onCloseErrorSheet());

      expect(close).toHaveBeenCalledTimes(1);
      expect(mockedConnectKnownOrNewDevice).toHaveBeenCalledTimes(1);
    });
  });

  describe("Save", () => {
    it("should call onConnected with isNewDevice when the flow connects a device", () => {
      const { initialProps } = setup();
      const connectionResult = makeConnectionResult();

      act(() => lastInput().onConnected(connectionResult, { isNewDevice: true }));

      expect(initialProps.onConnected).toHaveBeenCalledWith(connectionResult, {
        isNewDevice: true,
      });
    });

    it("should save the device as the last connected device and as a known device", () => {
      const { store } = setup();

      act(() => lastInput().onConnected(makeConnectionResult(), { isNewDevice: false }));

      const state = store.getState();
      expect(state.settings.lastConnectedDevice).toEqual(
        expect.objectContaining({ deviceId: "nano-x-id", wired: false }),
      );
      expect(state.knownDevices.knownDevices).toEqual([
        expect.objectContaining({ id: "nano-x-id", lastUsedAt: expect.any(Number) }),
      ]);
    });

    it("should turn off the read-only mode when the flow connects a device", () => {
      const { store } = setup();

      act(() => lastInput().onConnected(makeConnectionResult(), { isNewDevice: false }));

      expect(store.getState().settings.readOnlyModeEnabled).toBe(false);
    });

    it("should give the known devices of the store to the flow, and their changes", () => {
      const { store } = setup({}, state => ({
        ...state,
        knownDevices: { knownDevices: [knownNanoX] },
      }));
      const received: Array<Array<KnownDevice>> = [];
      lastInput().knownDevices$.subscribe(devices => received.push(devices));

      act(() => lastInput().onConnected(makeConnectionResult(), { isNewDevice: false }));

      expect(received[0]).toEqual([knownNanoX]);
      expect(received[received.length - 1]).toEqual(store.getState().knownDevices.knownDevices);
    });
  });

  describe("Remove", () => {
    it("should remove the device from the known devices and from the legacy BLE devices", () => {
      const { store } = setup({}, withKnownNanoX("other-device-id"));

      act(() => lastInput().removeKnownDevice(knownNanoX));

      expect(store.getState().knownDevices.knownDevices).toEqual([]);
      expect(store.getState().ble.knownDevices).toEqual([]);
    });

    it("should clear the last connected device when it is the removed device", () => {
      const { store } = setup({}, withKnownNanoX("nano-x-id"));

      act(() => lastInput().removeKnownDevice(knownNanoX));

      expect(store.getState().settings.lastConnectedDevice).toBeNull();
    });

    it("should keep the last connected device when it is another device", () => {
      const { store } = setup({}, withKnownNanoX("other-device-id"));

      act(() => lastInput().removeKnownDevice(knownNanoX));

      expect(store.getState().settings.lastConnectedDevice?.deviceId).toBe("other-device-id");
    });
  });

  describe("Add mode", () => {
    it("should not call onAddModeChange on mount", () => {
      const { initialProps } = setup();

      expect(initialProps.onAddModeChange).not.toHaveBeenCalled();
    });

    it("should call onAddModeChange when the Add mode starts and stops", () => {
      const { initialProps } = setup();

      emit(makeAddModeState());
      expect(initialProps.onAddModeChange).toHaveBeenLastCalledWith(true);
      emit(discoveringState);

      expect(initialProps.onAddModeChange).toHaveBeenLastCalledWith(false);
      expect(initialProps.onAddModeChange).toHaveBeenCalledTimes(2);
    });

    it("should close the Add mode when the Android back button is pressed", () => {
      const listeners: Array<() => boolean | null | undefined> = [];
      jest.spyOn(BackHandler, "addEventListener").mockImplementation((_, listener) => {
        listeners.push(listener);
        return { remove: jest.fn() };
      });
      setup();
      const close = jest.fn();

      emit(makeAddModeState(close));
      const handled = listeners[listeners.length - 1]?.();

      expect(handled).toBe(true);
      expect(close).toHaveBeenCalledTimes(1);
    });

    it("should close a discovery error of the Add mode when its sheet closes", () => {
      const { result } = setup();
      const close = jest.fn();
      emit({
        type: ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice,
        connectNewDeviceUIState: {
          type: ConnectNewDeviceUIStateTypes.DiscoveryError,
          error: { type: BaseDiscoveryErrorTypes.Unknown },
          ignore: jest.fn(),
          close,
        },
        close: jest.fn(),
      });

      act(() => result.current.onCloseAddModeErrorSheet());

      expect(close).toHaveBeenCalledTimes(1);
    });
  });
});
