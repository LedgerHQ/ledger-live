import { useEffect, useLayoutEffect, useRef } from "react";
import {
  ConnectKnownOrNewDeviceUIStateTypes,
  ConnectNewDeviceUIStateTypes,
  rnHidTransportIdentifier,
  type ConnectKnownOrNewDeviceUIState,
  type ConnectNewDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import {
  getConnectNewDeviceFailure,
  type DeviceIntentTrackingProperties,
  type SourceFlow,
} from "@ledgerhq/live-dmk-shared";
import { useIsNewDevice } from "LLM/components/DeviceConnection";
import { useDeviceIntentTracking } from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";
import {
  getTrackingTransport,
  PAGE_CONNECT_DEVICE,
  trackDeviceConnecting,
  trackDeviceflowCanceled,
} from "LLM/components/DeviceIntentExecutor/utils/trackDeviceIntent";

type TrackingContext = {
  sourceFlow: SourceFlow;
  analyticsProperties: DeviceIntentTrackingProperties;
};

function trackAddModeOutcome(
  { sourceFlow, analyticsProperties }: TrackingContext,
  lastAddModeState: ConnectNewDeviceUIState,
): void {
  if (lastAddModeState.type === ConnectNewDeviceUIStateTypes.Connected) return;
  trackDeviceflowCanceled({
    sourceFlow,
    extraProperties: analyticsProperties,
    failure: getConnectNewDeviceFailure(lastAddModeState, getTrackingTransport),
  });
}

/**
 * Sends `device_connecting` each time the device list connects a device, retries included, and the
 * outcome of the Add mode when it ends before a connection: Close, Android Back or an unmount of the
 * list. After a fatal error, the unknown error sheet of the list sends it.
 */
export function useConnectKnownOrNewDeviceTracking(state: ConnectKnownOrNewDeviceUIState): void {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const isNewDevice = useIsNewDevice();

  const latestRef = useRef<TrackingContext>({ sourceFlow, analyticsProperties });
  useLayoutEffect(() => {
    latestRef.current = { sourceFlow, analyticsProperties };
  });

  const previousTypeRef = useRef<ConnectKnownOrNewDeviceUIState["type"] | null>(null);
  // Set while the Add mode shows.
  const lastAddModeStateRef = useRef<ConnectNewDeviceUIState | null>(null);

  useEffect(() => {
    const previousType = previousTypeRef.current;
    previousTypeRef.current = state.type;

    if (state.type !== ConnectKnownOrNewDeviceUIStateTypes.Connecting) return;
    if (previousType === ConnectKnownOrNewDeviceUIStateTypes.Connecting) return;
    trackDeviceConnecting({
      sourceFlow,
      modelId: state.device.deviceModelId,
      transport: state.device.transport === rnHidTransportIdentifier ? "usb" : "ble",
      extraProperties: {
        ...analyticsProperties,
        isNewDevice: isNewDevice(state.device),
        // The connecting sheet sends its page later, through its portal.
        page: PAGE_CONNECT_DEVICE.Connecting,
      },
    });
  }, [analyticsProperties, isNewDevice, sourceFlow, state]);

  useEffect(() => {
    if (state.type === ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice) {
      lastAddModeStateRef.current = state.connectNewDeviceUIState;
      return;
    }
    const lastAddModeState = lastAddModeStateRef.current;
    lastAddModeStateRef.current = null;
    if (!lastAddModeState || state.type === ConnectKnownOrNewDeviceUIStateTypes.UnknownError) {
      return;
    }
    trackAddModeOutcome(latestRef.current, lastAddModeState);
  }, [state]);

  useEffect(() => {
    const latest = latestRef;
    const lastAddModeState = lastAddModeStateRef;

    return () => {
      if (lastAddModeState.current) trackAddModeOutcome(latest.current, lastAddModeState.current);
    };
  }, []);
}
