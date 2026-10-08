import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { log } from "@ledgerhq/logs";
import {
  connectNewDevice,
  ConnectNewDeviceUIStateTypes,
  useDeviceManagementKit,
  type ConnectNewDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import type { AppPlatform } from "@ledgerhq/live-common/platform/types";
import { useSaveConnectedDevice } from "LLM/components/DeviceConnection";
import type {
  ConnectNewDeviceErrorUIState,
  ConnectNewDeviceNonErrorUIState,
  ConnectNewDeviceProps,
} from "./types";

const LOG_TYPE = "ConnectNewDevice";

const ERROR_STATE_TYPES = new Set<ConnectNewDeviceUIState["type"]>([
  ConnectNewDeviceUIStateTypes.DiscoveryError,
  ConnectNewDeviceUIStateTypes.ConnectionError,
  ConnectNewDeviceUIStateTypes.UnknownError,
]);

export function isErrorState(
  state: ConnectNewDeviceUIState,
): state is ConnectNewDeviceErrorUIState {
  return ERROR_STATE_TYPES.has(state.type);
}

// Shown until the use case emits its first state.
const INITIAL_STATE: ConnectNewDeviceNonErrorUIState = {
  type: ConnectNewDeviceUIStateTypes.Discovering,
  devices: [],
  scanningTransports: [],
  showDeviceNotFound: false,
};

type ViewState = {
  state: ConnectNewDeviceUIState;
  /** Shown under the error bottom sheet. */
  lastNonErrorState: ConnectNewDeviceNonErrorUIState;
};

export type ConnectNewDeviceViewModel = ViewState & {
  platform: Exclude<AppPlatform, "desktop">;
  onDeviceNotFound?: () => void;
  onCloseErrorSheet: () => void;
};

export function useConnectNewDeviceViewModel({
  onConnected,
  onDeviceNotFound,
  onClose,
  delays,
}: ConnectNewDeviceProps): ConnectNewDeviceViewModel {
  const platform = Platform.OS === "ios" ? "ios" : "android";
  const dmk = useDeviceManagementKit();
  const saveConnectedDevice = useSaveConnectedDevice({ isNewDevice: true });
  const [viewState, setViewState] = useState<ViewState>({
    state: INITIAL_STATE,
    lastNonErrorState: INITIAL_STATE,
  });

  // The flow starts once per mount: callers can pass new callbacks without restarting it.
  const callbacksRef = useRef({ onConnected, onClose });
  useEffect(() => {
    callbacksRef.current = { onConnected, onClose };
  }, [onConnected, onClose]);
  const initialDelaysRef = useRef(delays);

  if (!dmk) {
    log(LOG_TYPE, "DMK unavailable");
    throw new Error("Device Management Kit is not available");
  }

  useEffect(() => {
    const subscription = connectNewDevice({
      dmk,
      onConnected: result => {
        saveConnectedDevice(result.connectedDevice);
        callbacksRef.current.onConnected(result);
      },
      onClose: () => callbacksRef.current.onClose(),
      deviceNotFoundDelay: initialDelaysRef.current?.deviceNotFound,
      successDelay: initialDelaysRef.current?.success,
    }).subscribe({
      next: state =>
        setViewState(previous => ({
          state,
          lastNonErrorState: isErrorState(state) ? previous.lastNonErrorState : state,
        })),
    });

    return () => subscription.unsubscribe();
  }, [dmk, saveConnectedDevice]);

  const { state } = viewState;

  const onCloseErrorSheet = useCallback(() => {
    switch (state.type) {
      case ConnectNewDeviceUIStateTypes.DiscoveryError:
      case ConnectNewDeviceUIStateTypes.ConnectionError:
        state.close();
        return;
      case ConnectNewDeviceUIStateTypes.UnknownError:
        callbacksRef.current.onClose();
        return;
      default:
        // The sheet also reports a close when the state leaves an error: nothing to do then.
        return;
    }
  }, [state]);

  return {
    ...viewState,
    platform,
    onDeviceNotFound,
    onCloseErrorSheet,
  };
}
