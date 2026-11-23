import { useEffect, useLayoutEffect, useRef } from "react";
import {
  ConnectNewDeviceUIStateTypes,
  rnHidTransportIdentifier,
  type ConnectNewDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { getConnectNewDeviceFailure, type DeviceFlowFailure } from "@ledgerhq/live-dmk-shared";
import { useIsNewDevice } from "LLM/components/DeviceConnection";
import { useDeviceIntentTracking } from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";
import {
  getTrackingTransport,
  trackDeviceConnecting,
  trackDeviceflowCanceled,
  trackDevicePrompted,
} from "LLM/components/DeviceIntentExecutor/utils/trackDeviceIntent";
import { getScanningMode } from "./utils/getScanningMode";

/**
 * Sends the flow events of Connect New Device, alone or in the Add mode of the device list:
 * `device_prompted` once discovery runs, `device_connecting` at each connection and, alone,
 * `deviceflow_aborted` or `deviceflow_failed` when the flow unmounts before a connection. In the
 * Add mode, the device list sends the outcome.
 */
export function useConnectNewDeviceTracking(
  state: ConnectNewDeviceUIState,
  { reportsOutcome }: { reportsOutcome: boolean },
): void {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const isNewDevice = useIsNewDevice();

  const latestRef = useRef({ sourceFlow, analyticsProperties, reportsOutcome });
  useLayoutEffect(() => {
    latestRef.current = { sourceFlow, analyticsProperties, reportsOutcome };
  });

  const isPromptedRef = useRef(false);
  const previousTypeRef = useRef<ConnectNewDeviceUIState["type"] | null>(null);
  // The error screen shown last, reported when the flow ends on it.
  const failureRef = useRef<DeviceFlowFailure | null>(null);
  const isConnectedRef = useRef(false);

  useEffect(() => {
    const previousType = previousTypeRef.current;
    previousTypeRef.current = state.type;

    switch (state.type) {
      case ConnectNewDeviceUIStateTypes.Discovering:
        failureRef.current = null;
        // Until discovery runs, the scanned transports are unknown.
        if (isPromptedRef.current || state.scanningTransports.length === 0) return;
        isPromptedRef.current = true;
        trackDevicePrompted({
          sourceFlow,
          extraProperties: {
            ...analyticsProperties,
            scanningMode: getScanningMode(state.scanningTransports),
          },
        });
        return;
      case ConnectNewDeviceUIStateTypes.Connecting:
        failureRef.current = null;
        if (previousType === ConnectNewDeviceUIStateTypes.Connecting) return;
        trackDeviceConnecting({
          sourceFlow,
          modelId: state.device.deviceModelId,
          transport: state.device.transport === rnHidTransportIdentifier ? "usb" : "ble",
          extraProperties: { ...analyticsProperties, isNewDevice: isNewDevice(state.device) },
        });
        return;
      case ConnectNewDeviceUIStateTypes.Connected:
      case ConnectNewDeviceUIStateTypes.Done:
        failureRef.current = null;
        isConnectedRef.current = true;
        return;
      case ConnectNewDeviceUIStateTypes.Terminated:
        return;
      default:
        failureRef.current = getConnectNewDeviceFailure(state, getTrackingTransport);
    }
  }, [analyticsProperties, isNewDevice, sourceFlow, state]);

  useEffect(() => {
    const latest = latestRef;
    const failure = failureRef;
    const isConnected = isConnectedRef;

    return () => {
      if (isConnected.current || !latest.current.reportsOutcome) return;
      trackDeviceflowCanceled({
        sourceFlow: latest.current.sourceFlow,
        extraProperties: latest.current.analyticsProperties,
        failure: failure.current,
      });
    };
  }, []);
}
