import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, Platform } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { log } from "@ledgerhq/logs";
import { useMockServerDevices } from "@features/platform-device-mock-server";
import {
  connectKnownOrNewDevice,
  ConnectKnownOrNewDeviceUIStateTypes,
  ConnectNewDeviceUIStateTypes,
  mockserverIdentifier,
  useDeviceManagementKit,
  type ConnectKnownOrNewDevice,
  type ConnectKnownOrNewDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { buildMockServerCompatDeviceId, type KnownDevice } from "@ledgerhq/live-dmk-shared";
import { BehaviorSubject } from "rxjs";
import { isErrorState } from "LLM/components/ConnectNewDevice";
import { useSaveConnectedDevice } from "LLM/components/DeviceConnection";
import { removeKnownBleDevice } from "~/actions/ble";
import { setLastConnectedDevice, setReadOnlyMode } from "~/actions/settings";
import { useDispatch, useSelector } from "~/context/hooks";
import { knownDevicesSelector, removeKnownDevice } from "~/reducers/knownDevices";
import {
  isMockServerEnabledSelector,
  lastConnectedDeviceSelector,
  mockServerConfigSelector,
} from "~/reducers/settings";
import type {
  ConnectKnownOrNewDeviceDelays,
  ConnectKnownOrNewDeviceProps,
  ConnectKnownOrNewDeviceViewProps,
} from "./types";
import { useIsAppInBackground } from "./useIsAppInBackground";

const LOG_TYPE = "ConnectKnownOrNewDevice";

// Shown until the use case emits its first state.
const INITIAL_STATE: ConnectKnownOrNewDeviceUIState = {
  type: ConnectKnownOrNewDeviceUIStateTypes.Discovering,
  devices: [],
  addNewDevice: () => undefined,
};

const INITIAL_ADD_MODE_STATE: ConnectKnownOrNewDeviceViewProps["addModeLastNonErrorState"] = {
  type: ConnectNewDeviceUIStateTypes.Discovering,
  devices: [],
  scanningTransports: [],
  showDeviceNotFound: false,
};

type ViewState = Pick<
  ConnectKnownOrNewDeviceViewProps,
  "state" | "devices" | "addModeLastNonErrorState"
>;

const INITIAL_VIEW_STATE: ViewState = {
  state: INITIAL_STATE,
  devices: [],
  addModeLastNonErrorState: INITIAL_ADD_MODE_STATE,
};

function getAddModeLastNonErrorState(
  previous: ViewState,
  state: ConnectKnownOrNewDeviceUIState,
): ViewState["addModeLastNonErrorState"] {
  if (state.type !== ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice) {
    return INITIAL_ADD_MODE_STATE;
  }
  const addModeState = state.connectNewDeviceUIState;
  return isErrorState(addModeState) ? previous.addModeLastNonErrorState : addModeState;
}

function toNextViewState(previous: ViewState, state: ConnectKnownOrNewDeviceUIState): ViewState {
  return {
    state,
    devices: "devices" in state ? state.devices : previous.devices,
    addModeLastNonErrorState: getAddModeLastNonErrorState(previous, state),
  };
}

function toLibraryDelays(delays: ConnectKnownOrNewDeviceDelays | undefined) {
  return {
    ...(delays?.deviceNotFound === undefined ? {} : { deviceNotFoundDelay: delays.deviceNotFound }),
    connectNewDevice: {
      ...(delays?.connectNewDevice?.deviceNotFound === undefined
        ? {}
        : { deviceNotFoundDelay: delays.connectNewDevice.deviceNotFound }),
      ...(delays?.connectNewDevice?.success === undefined
        ? {}
        : { successDelay: delays.connectNewDevice.success }),
    },
  };
}

function getLastConnectedDeviceId({ transport, id }: KnownDevice): string {
  return transport === mockserverIdentifier ? buildMockServerCompatDeviceId(id) : id;
}

export function useConnectKnownOrNewDeviceViewModel({
  onConnected,
  onAddModeChange,
  isPaused,
  onDeviceNotFound,
  delays,
  children,
}: ConnectKnownOrNewDeviceProps): ConnectKnownOrNewDeviceViewProps {
  const platform = Platform.OS === "ios" ? "ios" : "android";
  const dmk = useDeviceManagementKit();
  const dispatch = useDispatch();
  const isMockServerEnabled = useSelector(isMockServerEnabledSelector);
  const mockServerConfig = useSelector(mockServerConfigSelector);
  const mockServerDevices = useMockServerDevices(mockServerConfig);
  const knownDevices = useSelector(knownDevicesSelector);
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const saveConnectedDevice = useSaveConnectedDevice();
  const isFocused = useIsFocused();
  const isAppInBackground = useIsAppInBackground();
  const shouldPause = isPaused || !isFocused || isAppInBackground;

  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
  const [restartCount, setRestartCount] = useState(0);
  const [knownDevices$] = useState(() => new BehaviorSubject(knownDevices));
  const flowRef = useRef<ConnectKnownOrNewDevice | null>(null);
  const initialDelaysRef = useRef(delays);

  // The flow starts once per mount and per restart: the latest values are read from here.
  const latestRef = useRef({
    onConnected,
    onAddModeChange,
    mockServerDevices,
    lastConnectedDevice,
    shouldPause,
  });
  useEffect(() => {
    latestRef.current = {
      onConnected,
      onAddModeChange,
      mockServerDevices,
      lastConnectedDevice,
      shouldPause,
    };
  });

  useEffect(() => {
    knownDevices$.next(knownDevices);
  }, [knownDevices, knownDevices$]);

  const removeDevice = useCallback(
    (knownDevice: KnownDevice) => {
      dispatch(removeKnownDevice(knownDevice.id));
      dispatch(removeKnownBleDevice(knownDevice.id));
      const isLastConnectedDevice =
        latestRef.current.lastConnectedDevice?.deviceId === getLastConnectedDeviceId(knownDevice);
      if (isLastConnectedDevice) {
        dispatch(setLastConnectedDevice(null));
      }
    },
    [dispatch],
  );

  if (!dmk) {
    log(LOG_TYPE, "DMK unavailable");
    throw new Error("Device Management Kit is not available");
  }

  useEffect(() => {
    log(LOG_TYPE, "start", { restartCount });
    const flow = connectKnownOrNewDevice({
      dmk,
      knownDevices$,
      removeKnownDevice: removeDevice,
      onConnected: (result, options) => {
        saveConnectedDevice(result.connectedDevice);
        dispatch(setReadOnlyMode(false));
        latestRef.current.onConnected(result, options);
      },
      isMockServerEnabled,
      getMockServerDevices: () => latestRef.current.mockServerDevices,
      isPaused: latestRef.current.shouldPause,
      delays: toLibraryDelays(initialDelaysRef.current),
    });
    flowRef.current = flow;
    const subscription = flow.uiStates.subscribe({
      next: state => setViewState(previous => toNextViewState(previous, state)),
    });

    return () => {
      subscription.unsubscribe();
      flowRef.current = null;
    };
  }, [
    dispatch,
    dmk,
    isMockServerEnabled,
    knownDevices$,
    removeDevice,
    restartCount,
    saveConnectedDevice,
  ]);

  useEffect(() => {
    if (shouldPause) {
      flowRef.current?.pause();
    } else {
      flowRef.current?.resume();
    }
  }, [shouldPause]);

  const { state } = viewState;
  const isAdding = state.type === ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice;

  const wasAddingRef = useRef(false);
  useEffect(() => {
    if (wasAddingRef.current !== isAdding) {
      wasAddingRef.current = isAdding;
      latestRef.current.onAddModeChange(isAdding);
    }
  }, [isAdding]);

  useEffect(() => {
    if (state.type !== ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice) {
      return;
    }
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      state.close();
      return true;
    });
    return () => subscription.remove();
  }, [state]);

  const onCloseErrorSheet = useCallback(() => {
    switch (state.type) {
      case ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError:
      case ConnectKnownOrNewDeviceUIStateTypes.ConnectionError:
        state.close();
        return;
      case ConnectKnownOrNewDeviceUIStateTypes.UnknownError:
        setRestartCount(count => count + 1);
        return;
      default:
        // The sheet also reports a close when the state leaves an error: nothing to do then.
        return;
    }
  }, [state]);

  const onCloseAddModeErrorSheet = useCallback(() => {
    if (state.type !== ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice) {
      return;
    }
    const addModeState = state.connectNewDeviceUIState;
    if (
      addModeState.type === ConnectNewDeviceUIStateTypes.DiscoveryError ||
      addModeState.type === ConnectNewDeviceUIStateTypes.ConnectionError
    ) {
      addModeState.close();
    }
  }, [state]);

  return {
    ...viewState,
    platform,
    onDeviceNotFound,
    onCloseErrorSheet,
    onCloseAddModeErrorSheet,
    children,
  };
}
