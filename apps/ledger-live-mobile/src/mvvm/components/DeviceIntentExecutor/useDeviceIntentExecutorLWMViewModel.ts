import { useCallback, useEffect, useRef } from "react";
import type {
  DeviceConnectionResult,
  DeviceIntentExecutorProps,
  ExecutorState,
} from "@ledgerhq/device-intent";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import {
  trackAppReady,
  trackDeviceflowCanceled,
  trackDeviceflowCompleted,
  trackDeviceflowStarted,
  trackDrawerCloseButtonClicked,
} from "./utils/trackDeviceIntent";
import type { InitializerConfig } from "./DeviceContextInitializerComponentLWM";
import type { InitializationInput } from "./types";
import { useDeviceIntentExecutorHeaderOverrideRequests } from "./hooks/useDeviceIntentExecutorHeaderOverrideRequests";
import type { DeviceIntentExecutorHeaderContextValue } from "./utils/DeviceIntentExecutorHeaderContext";
import type { SourceFlow } from "./utils/SourceFlowContext";

type Props<JobState, Input, ExtraProps> = DeviceIntentExecutorProps<
  JobState,
  Input,
  ExtraProps,
  InitializationInput
> & {
  initializerConfig?: InitializerConfig;
  sourceFlow: SourceFlow;
};

export type DeviceIntentExecutorLWMViewModel<JobState, Input, ExtraProps> = {
  sourceFlow: SourceFlow;
  wrappedProps: Props<JobState, Input, ExtraProps>;
  hasHeaderOverride: boolean;
  headerContextValue: DeviceIntentExecutorHeaderContextValue;
};

type ConnectionTrackingInfo = {
  modelId: DeviceModelId;
  transport: "ble" | "usb";
};

function mapConnectionResult(result: DeviceConnectionResult): ConnectionTrackingInfo {
  return {
    modelId: dmkToLedgerDeviceIdMap[result.connectedDevice.modelId],
    transport: result.connectedDevice.type === "USB" ? "usb" : "ble",
  };
}

export function useDeviceIntentExecutorLWMViewModel<JobState, Input, ExtraProps>(
  props: Props<JobState, Input, ExtraProps>,
): DeviceIntentExecutorLWMViewModel<JobState, Input, ExtraProps> {
  const { enabled, sourceFlow, onExecutorStateChanged, onUserCancel } = props;

  const flowStartedRef = useRef(false);
  const initializationCompletedRef = useRef(false);
  const closeTrackedRef = useRef(false);
  const { hasHeaderOverride, headerContextValue } = useDeviceIntentExecutorHeaderOverrideRequests();

  useEffect(() => {
    if (!enabled) {
      flowStartedRef.current = false;
      initializationCompletedRef.current = false;
      closeTrackedRef.current = false;
      return;
    }

    if (flowStartedRef.current) return;
    flowStartedRef.current = true;
    initializationCompletedRef.current = false;
    trackDeviceflowStarted({ sourceFlow });
  }, [enabled, sourceFlow]);

  const wrappedOnExecutorStateChanged = useCallback(
    (state: ExecutorState) => {
      if (enabled && state.type === "executingIntent" && !initializationCompletedRef.current) {
        initializationCompletedRef.current = true;
        const { modelId, transport } = mapConnectionResult(state.connectionResult);
        trackAppReady({ sourceFlow, modelId });
        trackDeviceflowCompleted({ sourceFlow, modelId, transport });
      }
      onExecutorStateChanged(state);
    },
    [enabled, onExecutorStateChanged, sourceFlow],
  );

  const wrappedOnUserCancel = useCallback(() => {
    if (!closeTrackedRef.current) {
      closeTrackedRef.current = true;
      trackDrawerCloseButtonClicked({ sourceFlow });
      if (!initializationCompletedRef.current) {
        trackDeviceflowCanceled({ sourceFlow });
      }
    }
    onUserCancel();
  }, [onUserCancel, sourceFlow]);

  return {
    sourceFlow,
    hasHeaderOverride,
    headerContextValue,
    wrappedProps: {
      ...props,
      onExecutorStateChanged: wrappedOnExecutorStateChanged,
      onUserCancel: wrappedOnUserCancel,
    },
  };
}
