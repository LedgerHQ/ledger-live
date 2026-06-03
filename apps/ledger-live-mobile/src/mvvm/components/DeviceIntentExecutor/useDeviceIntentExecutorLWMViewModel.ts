import { useCallback, useRef } from "react";
import type {
  DeviceConnectionResult,
  DeviceIntentExecutorProps,
  ExecutorState,
} from "@ledgerhq/device-intent";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import {
  trackAppReady,
  trackDeviceflowAborted,
  trackDeviceflowCompleted,
} from "./utils/trackDeviceIntent";
import type { InitializerConfig } from "./DeviceContextInitializerComponentLWM";
import type { InitializationInput } from "./types";
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
  const { sourceFlow, onExecutorStateChanged, onUserCancel } = props;

  const initializationCompletedRef = useRef(false);

  const wrappedOnExecutorStateChanged = useCallback(
    (state: ExecutorState) => {
      if (state.type === "executingIntent" && !initializationCompletedRef.current) {
        initializationCompletedRef.current = true;
        const { modelId, transport } = mapConnectionResult(state.connectionResult);
        trackAppReady({ sourceFlow, modelId });
        trackDeviceflowCompleted({ sourceFlow, modelId, transport });
      }
      onExecutorStateChanged(state);
    },
    [onExecutorStateChanged, sourceFlow],
  );

  const wrappedOnUserCancel = useCallback(() => {
    if (!initializationCompletedRef.current) {
      trackDeviceflowAborted({ sourceFlow });
    }
    onUserCancel();
  }, [onUserCancel, sourceFlow]);

  return {
    sourceFlow,
    wrappedProps: {
      ...props,
      onExecutorStateChanged: wrappedOnExecutorStateChanged,
      onUserCancel: wrappedOnUserCancel,
    },
  };
}
