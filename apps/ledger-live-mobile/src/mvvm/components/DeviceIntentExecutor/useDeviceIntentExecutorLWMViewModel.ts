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
import { useKeepScreenAwake } from "~/hooks/useKeepScreenAwake";
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
  /**
   * Tracks the "Close" `button_clicked` event when the drawer header close button is pressed.
   * Wired to the drawer's `onHeaderClosePressed` so tracking reflects real user intent, unlike
   * `onClose` which can fire for any closing reason.
   */
  onHeaderClosePressed: () => void;
  /**
   * Tracks the "Close" `button_clicked` event when the drawer backdrop is pressed.
   * Wired to the drawer's `onBackdropPress` so tracking reflects real user intent, unlike
   * `onClose` which can fire for any closing reason.
   */
  onBackdropPress: () => void;
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
  const cancelTrackedRef = useRef(false);
  const { hasHeaderOverride, headerContextValue } = useDeviceIntentExecutorHeaderOverrideRequests();

  useKeepScreenAwake(enabled);

  useEffect(() => {
    if (!enabled) {
      flowStartedRef.current = false;
      initializationCompletedRef.current = false;
      cancelTrackedRef.current = false;
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

  const trackClose = useCallback(() => {
    trackDrawerCloseButtonClicked({ sourceFlow });
  }, [sourceFlow]);

  const wrappedOnUserCancel = useCallback(() => {
    if (!cancelTrackedRef.current) {
      cancelTrackedRef.current = true;
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
    onHeaderClosePressed: trackClose,
    onBackdropPress: trackClose,
    wrappedProps: {
      ...props,
      onExecutorStateChanged: wrappedOnExecutorStateChanged,
      onUserCancel: wrappedOnUserCancel,
    },
  };
}
