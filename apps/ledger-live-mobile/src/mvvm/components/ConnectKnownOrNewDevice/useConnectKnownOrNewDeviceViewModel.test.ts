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
    it("GIVEN isPaused is true, WHEN the hook mounts, THEN it should start the flow paused", () => {
      // GIVEN / WHEN
      setup({ isPaused: true });

      // THEN
      expect(lastInput().isPaused).toBe(true);
    });

    it("GIVEN isPaused became true and paused the flow, WHEN isPaused becomes false, THEN it should resume the flow", () => {
      // GIVEN
      const { rerender } = setup();
      rerender({ isPaused: true });
      expect(mockPause).toHaveBeenCalledTimes(1);

      // WHEN
      rerender({ isPaused: false });

      // THEN
      expect(mockResume).toHaveBeenCalledTimes(2);
    });

    it("GIVEN the screen lost focus and paused the flow, WHEN the screen is focused again, THEN it should resume the flow", () => {
      // GIVEN
      const { rerender } = setup();
      mockResume.mockClear();
      mockIsFocused.mockReturnValue(false);
      rerender({});
      expect(mockPause).toHaveBeenCalledTimes(1);

      // WHEN
      mockIsFocused.mockReturnValue(true);
      rerender({});

      // THEN
      expect(mockResume).toHaveBeenCalledTimes(1);
    });

    it("GIVEN the app went to the background and paused the flow, WHEN the app comes back, THEN it should resume the flow", () => {
      // GIVEN
      setup();
      mockResume.mockClear();
      act(() => appStateListener?.("background"));
      expect(mockPause).toHaveBeenCalledTimes(1);

      // WHEN
      act(() => appStateListener?.("active"));

      // THEN
      expect(mockResume).toHaveBeenCalledTimes(1);
    });

    it("GIVEN a paused flow and a screen that is not focused, WHEN isPaused becomes false, THEN it should stay paused", () => {
      // GIVEN
      const { rerender } = setup({ isPaused: true });
      mockIsFocused.mockReturnValue(false);
      rerender({ isPaused: true });
      mockResume.mockClear();

      // WHEN
      rerender({ isPaused: false });

      // THEN
      expect(mockResume).not.toHaveBeenCalled();
    });
  });

  describe("Restart", () => {
    it("GIVEN an unknown error, WHEN the error sheet is closed, THEN it should start a new flow", () => {
      // GIVEN
      const { result } = setup();
      emit({ type: ConnectKnownOrNewDeviceUIStateTypes.UnknownError, error: new Error("boom") });

      // WHEN
      act(() => result.current.onCloseErrorSheet());

      // THEN
      expect(mockedConnectKnownOrNewDevice).toHaveBeenCalledTimes(2);
      expect(unsubscribes[0]).toHaveBeenCalledTimes(1);
    });

    it("GIVEN a device list, WHEN an unknown error occurs, THEN it should keep the rows of the last list under the error", () => {
      // GIVEN
      const { result } = setup();
      emit(discoveringState);

      // WHEN
      emit({ type: ConnectKnownOrNewDeviceUIStateTypes.UnknownError, error: new Error("boom") });

      // THEN
      expect(result.current.devices).toEqual(discoveringState.devices);
    });

    it("GIVEN a discovery error, WHEN its sheet closes, THEN it should close the discovery error", () => {
      // GIVEN
      const { result } = setup();
      const close = jest.fn();
      emit({
        type: ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError,
        devices: [nanoXRow],
        error: { type: BaseDiscoveryErrorTypes.Unknown },
        ignore: jest.fn(),
        close,
      });

      // WHEN
      act(() => result.current.onCloseErrorSheet());

      // THEN
      expect(close).toHaveBeenCalledTimes(1);
      expect(mockedConnectKnownOrNewDevice).toHaveBeenCalledTimes(1);
    });
  });

  describe("Save", () => {
    it("GIVEN a running flow, WHEN the flow connects a device, THEN it should call onConnected with isNewDevice", () => {
      // GIVEN
      const { initialProps } = setup();
      const connectionResult = makeConnectionResult();

      // WHEN
      act(() => lastInput().onConnected(connectionResult, { isNewDevice: true }));

      // THEN
      expect(initialProps.onConnected).toHaveBeenCalledWith(connectionResult, {
        isNewDevice: true,
      });
    });

    it("GIVEN a running flow, WHEN the flow connects a device, THEN it should save the device as the last connected device and as a known device", () => {
      // GIVEN
      const { store } = setup();

      // WHEN
      act(() => lastInput().onConnected(makeConnectionResult(), { isNewDevice: false }));

      // THEN
      const state = store.getState();
      expect(state.settings.lastConnectedDevice).toEqual(
        expect.objectContaining({ deviceId: "nano-x-id", wired: false }),
      );
      expect(state.knownDevices.knownDevices).toEqual([
        expect.objectContaining({ id: "nano-x-id", lastUsedAt: expect.any(Number) }),
      ]);
    });

    it("GIVEN a running flow, WHEN the flow connects a device, THEN it should turn off the read-only mode", () => {
      // GIVEN
      const { store } = setup();

      // WHEN
      act(() => lastInput().onConnected(makeConnectionResult(), { isNewDevice: false }));

      // THEN
      expect(store.getState().settings.readOnlyModeEnabled).toBe(false);
    });

    it("GIVEN known devices in the store, WHEN a connection changes them, THEN it should give the known devices of the store to the flow, and their changes", () => {
      // GIVEN
      const { store } = setup({}, state => ({
        ...state,
        knownDevices: { knownDevices: [knownNanoX] },
      }));
      const received: Array<Array<KnownDevice>> = [];
      lastInput().knownDevices$.subscribe(devices => received.push(devices));

      // WHEN
      act(() => lastInput().onConnected(makeConnectionResult(), { isNewDevice: false }));

      // THEN
      expect(received[0]).toEqual([knownNanoX]);
      expect(received[received.length - 1]).toEqual(store.getState().knownDevices.knownDevices);
    });
  });

  describe("Remove", () => {
    it("GIVEN a known device, WHEN the flow removes it, THEN it should remove the device from the known devices and from the legacy BLE devices", () => {
      // GIVEN
      const { store } = setup({}, withKnownNanoX("other-device-id"));

      // WHEN
      act(() => lastInput().removeKnownDevice(knownNanoX));

      // THEN
      expect(store.getState().knownDevices.knownDevices).toEqual([]);
      expect(store.getState().ble.knownDevices).toEqual([]);
    });

    it("GIVEN the known device is the last connected device, WHEN the flow removes it, THEN it should clear the last connected device", () => {
      // GIVEN
      const { store } = setup({}, withKnownNanoX("nano-x-id"));

      // WHEN
      act(() => lastInput().removeKnownDevice(knownNanoX));

      // THEN
      expect(store.getState().settings.lastConnectedDevice).toBeNull();
    });

    it("GIVEN the last connected device is another device, WHEN the flow removes a known device, THEN it should keep the last connected device", () => {
      // GIVEN
      const { store } = setup({}, withKnownNanoX("other-device-id"));

      // WHEN
      act(() => lastInput().removeKnownDevice(knownNanoX));

      // THEN
      expect(store.getState().settings.lastConnectedDevice?.deviceId).toBe("other-device-id");
    });
  });

  describe("Add mode", () => {
    it("GIVEN no Add mode, WHEN the hook mounts, THEN it should not call onAddModeChange", () => {
      // GIVEN / WHEN
      const { initialProps } = setup();

      // THEN
      expect(initialProps.onAddModeChange).not.toHaveBeenCalled();
    });

    it("GIVEN the Add mode started and called onAddModeChange with true, WHEN the Add mode stops, THEN it should call onAddModeChange with false", () => {
      // GIVEN
      const { initialProps } = setup();
      emit(makeAddModeState());
      expect(initialProps.onAddModeChange).toHaveBeenLastCalledWith(true);

      // WHEN
      emit(discoveringState);

      // THEN
      expect(initialProps.onAddModeChange).toHaveBeenLastCalledWith(false);
      expect(initialProps.onAddModeChange).toHaveBeenCalledTimes(2);
    });

    it("GIVEN the Add mode, WHEN the Android back button is pressed, THEN it should close the Add mode", () => {
      // GIVEN
      const listeners: Array<() => boolean | null | undefined> = [];
      jest.spyOn(BackHandler, "addEventListener").mockImplementation((_, listener) => {
        listeners.push(listener);
        return { remove: jest.fn() };
      });
      setup();
      const close = jest.fn();
      emit(makeAddModeState(close));

      // WHEN
      const handled = listeners[listeners.length - 1]?.();

      // THEN
      expect(handled).toBe(true);
      expect(close).toHaveBeenCalledTimes(1);
    });

    it("GIVEN a discovery error in the Add mode, WHEN its sheet closes, THEN it should close the discovery error", () => {
      // GIVEN
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

      // WHEN
      act(() => result.current.onCloseAddModeErrorSheet());

      // THEN
      expect(close).toHaveBeenCalledTimes(1);
    });
  });
});
