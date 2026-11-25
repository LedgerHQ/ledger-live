import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BackHandler, Platform } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { log } from "@ledgerhq/logs";
import { useMockServerDevices } from "@features/platform-device-mock-server";
import {
  buildUsbCompatDeviceId,
  connectKnownOrNewDevice,
  ConnectKnownOrNewDeviceUIStateTypes,
  ConnectNewDeviceUIStateTypes,
  mockserverIdentifier,
  rnHidTransportIdentifier,
  useDeviceManagementKit,
  type ConnectKnownOrNewDevice,
  type ConnectKnownOrNewDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import {
  buildMockServerCompatDeviceId,
  getConnectivityErrorFailure,
  type KnownDevice,
} from "@ledgerhq/live-dmk-shared";
import { BehaviorSubject } from "rxjs";
import { isErrorState } from "LLM/components/ConnectNewDevice";
import {
  useCheckIsNewConnectedDevice,
  useCheckIsNewDevice,
  useSaveConnectedDevice,
} from "LLM/components/DeviceConnection";
import { useDeviceIntentTracking } from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";
import {
  getConnectedDeviceTrackingProperties,
  getTrackingTransport,
  trackDeviceConnected,
  trackDeviceflowCanceled,
} from "LLM/components/DeviceIntentExecutor/utils/trackDeviceIntent";
import { removeKnownBleDevice } from "~/actions/ble";
import { setLastConnectedDevice, setReadOnlyMode } from "~/actions/settings";
import useIsAppInBackground from "~/components/useIsAppInBackground";
import { useDispatch, useSelector } from "~/context/hooks";
import { knownDevicesSelector, removeKnownDevice } from "~/reducers/knownDevices";
import {
  isMockServerEnabledSelector,
  lastConnectedDeviceSelector,
  mockServerConfigSelector,
} from "~/reducers/settings";
import type {
  ConnectKnownOrNewDeviceDelays,
  ConnectKnownOrNewDeviceErrorUIState,
  ConnectKnownOrNewDeviceProps,
  ConnectKnownOrNewDeviceViewProps,
} from "./types";
import { useConnectKnownOrNewDeviceTracking } from "./useConnectKnownOrNewDeviceTracking";
import { assertNever } from "./utils/assertNever";

const LOG_TYPE = "ConnectKnownOrNewDevice";

// Shown until the use case emits its first state.
const INITIAL_STATE: ConnectKnownOrNewDeviceUIState = {
  type: ConnectKnownOrNewDeviceUIStateTypes.Discovering,
  isPaused: false,
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

function getDevices(
  previous: ViewState,
  state: ConnectKnownOrNewDeviceUIState,
): ViewState["devices"] {
  switch (state.type) {
    case ConnectKnownOrNewDeviceUIStateTypes.Discovering:
    case ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice:
    case ConnectKnownOrNewDeviceUIStateTypes.Connecting:
    case ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError:
    case ConnectKnownOrNewDeviceUIStateTypes.ConnectionError:
      return state.devices;
    case ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice:
    case ConnectKnownOrNewDeviceUIStateTypes.UnknownError:
      return previous.devices;
    default:
      return assertNever(state);
  }
}

function toNextViewState(previous: ViewState, state: ConnectKnownOrNewDeviceUIState): ViewState {
  return {
    state,
    devices: getDevices(previous, state),
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
  if (transport === mockserverIdentifier) return buildMockServerCompatDeviceId(id);
  if (transport === rnHidTransportIdentifier) return buildUsbCompatDeviceId(id);
  return id;
}

export function useConnectKnownOrNewDeviceViewModel({
  sourceFlow,
  onConnected,
  onAddModeChange,
  isPaused,
  onDeviceNotFound,
  onAddDevice,
  delays,
  listFooter,
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
  const checkIsNewConnectedDevice = useCheckIsNewConnectedDevice();
  const checkIsNewDevice = useCheckIsNewDevice();
  const { analyticsProperties } = useDeviceIntentTracking();
  const isFocused = useIsFocused();
  const isAppInBackground = useIsAppInBackground({ includeInactive: false });
  const shouldPause = isPaused || !isFocused || isAppInBackground;

  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
  const [restartCount, setRestartCount] = useState(0);
  const [knownDevices$] = useState(() => new BehaviorSubject(knownDevices));
  const flowRef = useRef<ConnectKnownOrNewDevice | null>(null);
  const initialDelaysRef = useRef(delays);

  // The flow starts once per mount and per restart: the latest values are read from here.
  const latestRef = useRef({
    sourceFlow,
    onConnected,
    onAddModeChange,
    onAddDevice,
    mockServerDevices,
    lastConnectedDevice,
    shouldPause,
    checkIsNewConnectedDevice,
  });
  useLayoutEffect(() => {
    latestRef.current = {
      sourceFlow,
      onConnected,
      onAddModeChange,
      onAddDevice,
      mockServerDevices,
      lastConnectedDevice,
      shouldPause,
      checkIsNewConnectedDevice,
    };
  });
  // The flow calls onConnected before it emits the state that follows the connection.
  const lastStateTypeRef = useRef<ConnectKnownOrNewDeviceUIState["type"] | null>(null);

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

  const hasOnAddDevice = onAddDevice !== undefined;
  useEffect(() => {
    log(LOG_TYPE, "start", { restartCount });
    const flow = connectKnownOrNewDevice({
      dmk,
      knownDevices$,
      removeKnownDevice: removeDevice,
      onConnected: result => {
        const { connectedDevice } = result;
        // A tap on a connected device reuses its session: no new connection then.
        const isNewConnection =
          lastStateTypeRef.current === ConnectKnownOrNewDeviceUIStateTypes.Connecting ||
          lastStateTypeRef.current === ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice;
        if (isNewConnection) {
          // Before the save, which makes every device known.
          trackDeviceConnected({
            sourceFlow: latestRef.current.sourceFlow,
            ...getConnectedDeviceTrackingProperties(connectedDevice),
            extraProperties: {
              isNewDevice: latestRef.current.checkIsNewConnectedDevice(connectedDevice),
            },
          });
        }
        saveConnectedDevice(connectedDevice);
        dispatch(setReadOnlyMode(false));
        latestRef.current.onConnected(result);
      },
      onAddNewDevice: hasOnAddDevice
        ? hasDevices => latestRef.current.onAddDevice?.(hasDevices)
        : undefined,
      isMockServerEnabled,
      getMockServerDevices: () => latestRef.current.mockServerDevices,
      isPaused: latestRef.current.shouldPause,
      delays: toLibraryDelays(initialDelaysRef.current),
    });
    flowRef.current = flow;
    const subscription = flow.uiStates.subscribe({
      next: state => {
        lastStateTypeRef.current = state.type;
        setViewState(previous => toNextViewState(previous, state));
      },
    });

    return () => {
      subscription.unsubscribe();
      flowRef.current = null;
    };
  }, [
    dispatch,
    dmk,
    hasOnAddDevice,
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
  useConnectKnownOrNewDeviceTracking(state);
  const isAdding = state.type === ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice;

  const wasAddingRef = useRef(false);
  // Before paint: the caller hides the rest of its screen in the first frame of the Add mode.
  useLayoutEffect(() => {
    if (wasAddingRef.current !== isAdding) {
      wasAddingRef.current = isAdding;
      latestRef.current.onAddModeChange(isAdding);
    }
  }, [isAdding]);

  const closeAddModeRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    if (state.type === ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice) {
      closeAddModeRef.current = state.close;
    }
  });

  const handlesBackPress = isAdding && isFocused;
  useEffect(() => {
    if (!handlesBackPress) {
      return;
    }
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      closeAddModeRef.current();
      return true;
    });
    return () => subscription.remove();
  }, [handlesBackPress]);

  const onCloseErrorSheet = useCallback(() => {
    // Every close of an error sheet ends the attempt, also when the screen loses focus.
    const trackOutcome = (errorState: ConnectKnownOrNewDeviceErrorUIState) =>
      trackDeviceflowCanceled({
        sourceFlow,
        extraProperties: analyticsProperties,
        failure: getConnectivityErrorFailure(errorState, getTrackingTransport),
      });

    switch (state.type) {
      case ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError:
      case ConnectKnownOrNewDeviceUIStateTypes.ConnectionError:
        trackOutcome(state);
        state.close();
        return;
      case ConnectKnownOrNewDeviceUIStateTypes.UnknownError:
        trackOutcome(state);
        setRestartCount(count => count + 1);
        return;
      case ConnectKnownOrNewDeviceUIStateTypes.Discovering:
      case ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice:
      case ConnectKnownOrNewDeviceUIStateTypes.Connecting:
      case ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice:
        // The sheet also reports a close when the state leaves an error: nothing to do then.
        return;
      default:
        assertNever(state);
    }
  }, [analyticsProperties, sourceFlow, state]);

  // The waiting and connecting sheet also closes once the state has left it, for instance for the
  // Add mode: only a close while it shows ends the attempt.
  const latestStateRef = useRef(state);
  useLayoutEffect(() => {
    latestStateRef.current = state;
  });

  const onCloseDeviceStateSheet = useCallback(() => {
    const currentState = latestStateRef.current;
    if (
      currentState.type !== ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice &&
      currentState.type !== ConnectKnownOrNewDeviceUIStateTypes.Connecting
    ) {
      return;
    }
    trackDeviceflowCanceled({ sourceFlow, extraProperties: analyticsProperties, failure: null });
    currentState.close();
  }, [analyticsProperties, sourceFlow]);

  const onCloseAddModeErrorSheet = useCallback(() => {
    if (state.type !== ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice) {
      return;
    }
    const addModeState = state.connectNewDeviceUIState;
    switch (addModeState.type) {
      case ConnectNewDeviceUIStateTypes.DiscoveryError:
      case ConnectNewDeviceUIStateTypes.ConnectionError:
        addModeState.close();
        return;
      case ConnectNewDeviceUIStateTypes.Discovering:
      case ConnectNewDeviceUIStateTypes.Connecting:
      case ConnectNewDeviceUIStateTypes.Connected:
        return;
      default:
        assertNever(addModeState);
    }
  }, [state]);

  return {
    ...viewState,
    platform,
    onDeviceNotFound,
    onCloseErrorSheet,
    onCloseDeviceStateSheet,
    onCloseAddModeErrorSheet,
    checkIsNewDevice,
    listFooter,
    children,
  };
}
