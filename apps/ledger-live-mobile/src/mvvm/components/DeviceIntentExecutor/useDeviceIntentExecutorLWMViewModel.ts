import { useCallback, useEffect, useMemo, useRef } from "react";
import type {
  DeviceConnectionResult,
  DeviceIntentExecutorProps,
  ExecutorState,
} from "@features/platform-device-intent";
import {
  dmkToLedgerDeviceIdMap,
  type DeviceFlowFailure,
  type DeviceIntentExecutorHeaderContextValue,
  useDeviceIntentExecutorHeaderOverrideRequests,
} from "@ledgerhq/live-dmk-shared";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import {
  getExecutorStateFailure,
  trackAppReady,
  trackDeviceflowCanceled,
  trackDeviceflowCompleted,
  trackDeviceflowStarted,
  trackDrawerCloseButtonClicked,
} from "./utils/trackDeviceIntent";
import type { InitializerConfig } from "./DeviceContextInitializerComponentLWM";
import type { InitializationInput } from "./types";
import { useKeepScreenAwake } from "~/hooks/useKeepScreenAwake";
import type {
  DeviceIntentTrackingContextValue,
  DeviceIntentTrackingProperties,
  SourceFlow,
} from "./utils/DeviceIntentTrackingContext";

type Props<JobState, Input, ExtraProps, Result = undefined> = DeviceIntentExecutorProps<
  JobState,
  Input,
  ExtraProps,
  InitializationInput,
  Result
> & {
  initializerConfig?: InitializerConfig;
  sourceFlow: SourceFlow;
  analyticsProperties?: DeviceIntentTrackingProperties;
};

export type DeviceIntentExecutorLWMViewModel<JobState, Input, ExtraProps, Result = undefined> = {
  wrappedProps: Props<JobState, Input, ExtraProps, Result>;
  hasHeaderOverride: boolean;
  headerContextValue: DeviceIntentExecutorHeaderContextValue;
  trackingContextValue: DeviceIntentTrackingContextValue;
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

const emptyAnalyticsProperties: DeviceIntentTrackingProperties = {};

function mapConnectionResult(result: DeviceConnectionResult): ConnectionTrackingInfo {
  return {
    modelId: dmkToLedgerDeviceIdMap[result.connectedDevice.modelId],
    transport: result.connectedDevice.type === "USB" ? "usb" : "ble",
  };
}

export function useDeviceIntentExecutorLWMViewModel<
  JobState,
  Input,
  ExtraProps,
  Result = undefined,
>(
  props: Props<JobState, Input, ExtraProps, Result>,
): DeviceIntentExecutorLWMViewModel<JobState, Input, ExtraProps, Result> {
  const {
    enabled,
    sourceFlow,
    analyticsProperties = emptyAnalyticsProperties,
    onExecutorStateChanged,
    onUserCancel,
  } = props;

  const flowStartedRef = useRef(false);
  const initializationCompletedRef = useRef(false);
  const cancelTrackedRef = useRef(false);
  const failureRef = useRef<DeviceFlowFailure | null>(null);
  const { hasHeaderOverride, headerContextValue } = useDeviceIntentExecutorHeaderOverrideRequests();

  useKeepScreenAwake(enabled);

  useEffect(() => {
    if (!enabled) {
      flowStartedRef.current = false;
      initializationCompletedRef.current = false;
      cancelTrackedRef.current = false;
      failureRef.current = null;
      return;
    }

    if (flowStartedRef.current) return;
    flowStartedRef.current = true;
    initializationCompletedRef.current = false;
    trackDeviceflowStarted({ sourceFlow, extraProperties: analyticsProperties });
  }, [enabled, sourceFlow, analyticsProperties]);

  const wrappedOnExecutorStateChanged = useCallback(
    (state: ExecutorState) => {
      failureRef.current = getExecutorStateFailure(state);
      if (enabled && state.type === "executingIntent" && !initializationCompletedRef.current) {
        initializationCompletedRef.current = true;
        const { modelId, transport } = mapConnectionResult(state.connectionResult);
        trackAppReady({ sourceFlow, modelId, extraProperties: analyticsProperties });
        trackDeviceflowCompleted({
          sourceFlow,
          modelId,
          transport,
          extraProperties: analyticsProperties,
        });
      }
      onExecutorStateChanged(state);
    },
    [enabled, onExecutorStateChanged, sourceFlow, analyticsProperties],
  );

  const reportFailure = useCallback((failure: DeviceFlowFailure | null) => {
    failureRef.current = failure;
  }, []);

  const trackingContextValue = useMemo<DeviceIntentTrackingContextValue>(
    () => ({ sourceFlow, analyticsProperties, reportFailure }),
    [sourceFlow, analyticsProperties, reportFailure],
  );

  const trackClose = useCallback(() => {
    trackDrawerCloseButtonClicked({ sourceFlow, extraProperties: analyticsProperties });
  }, [sourceFlow, analyticsProperties]);

  const wrappedOnUserCancel = useCallback(() => {
    if (!cancelTrackedRef.current) {
      cancelTrackedRef.current = true;
      if (!initializationCompletedRef.current) {
        trackDeviceflowCanceled({
          sourceFlow,
          extraProperties: analyticsProperties,
          failure: failureRef.current,
        });
      }
    }
    onUserCancel();
  }, [onUserCancel, sourceFlow, analyticsProperties]);

  return {
    hasHeaderOverride,
    headerContextValue,
    trackingContextValue,
    onHeaderClosePressed: trackClose,
    onBackdropPress: trackClose,
    wrappedProps: {
      ...props,
      onExecutorStateChanged: wrappedOnExecutorStateChanged,
      onUserCancel: wrappedOnUserCancel,
    },
  };
}
