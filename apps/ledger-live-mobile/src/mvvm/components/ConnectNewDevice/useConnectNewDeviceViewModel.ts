import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { log } from "@ledgerhq/logs";
import {
  connectNewDevice,
  ConnectNewDeviceUIStateTypes,
  useDeviceManagementKit,
} from "@ledgerhq/live-dmk-mobile";
import { useSaveConnectedDevice } from "LLM/components/DeviceConnection";
import { useSelector } from "~/context/hooks";
import { isMockServerEnabledSelector } from "~/reducers/settings";
import type {
  ConnectNewDeviceNonErrorUIState,
  ConnectNewDeviceProps,
  ConnectNewDeviceViewProps,
} from "./types";
import { isErrorState } from "./utils/isErrorState";

const LOG_TYPE = "ConnectNewDevice";

// Shown until the use case emits its first state.
const INITIAL_STATE: ConnectNewDeviceNonErrorUIState = {
  type: ConnectNewDeviceUIStateTypes.Discovering,
  devices: [],
  scanningTransports: [],
  showDeviceNotFound: false,
};

type ViewState = Pick<ConnectNewDeviceViewProps, "state" | "lastNonErrorState">;

export function useConnectNewDeviceViewModel({
  onConnected,
  onDeviceNotFound,
  onClose,
  delays,
}: ConnectNewDeviceProps): ConnectNewDeviceViewProps {
  const platform = Platform.OS === "ios" ? "ios" : "android";
  const dmk = useDeviceManagementKit();
  const isMockServerEnabled = useSelector(isMockServerEnabledSelector);
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
      isMockServerEnabled,
    }).subscribe({
      next: state =>
        setViewState(previous => ({
          state,
          lastNonErrorState: isErrorState(state) ? previous.lastNonErrorState : state,
        })),
    });

    return () => subscription.unsubscribe();
  }, [dmk, isMockServerEnabled, saveConnectedDevice]);

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
