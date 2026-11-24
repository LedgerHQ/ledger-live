import { useEffect, useLayoutEffect, useRef } from "react";
import {
  ConnectKnownOrNewDeviceUIStateTypes,
  ConnectNewDeviceUIStateTypes,
  type ConnectKnownOrNewDeviceUIState,
  type ConnectNewDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import {
  getConnectNewDeviceFailure,
  type DeviceIntentTrackingProperties,
  type SourceFlow,
} from "@ledgerhq/live-dmk-shared";
import { useDeviceIntentTracking } from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";
import {
  getTrackingTransport,
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
 * Sends the outcome of the Add mode when it ends before a connection: Close, Android Back or an
 * unmount of the list. After a fatal error, the unknown error sheet of the list sends it.
 */
export function useConnectKnownOrNewDeviceTracking(state: ConnectKnownOrNewDeviceUIState): void {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();

  const latestRef = useRef<TrackingContext>({ sourceFlow, analyticsProperties });
  useLayoutEffect(() => {
    latestRef.current = { sourceFlow, analyticsProperties };
  });

  // Set while the Add mode shows.
  const lastAddModeStateRef = useRef<ConnectNewDeviceUIState | null>(null);

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
