import { useCallback, useEffect, useRef } from "react";
import type {
  DeviceConnectionResult,
  DeviceIntentExecutorProps,
  ExecutorState,
} from "@features/platform-device-intent";
import {
  dmkToLedgerDeviceIdMap,
  type DeviceIntentTrackingProperties,
  type DeviceIntentExecutorHeaderContextValue,
  type SourceFlow,
  useDeviceIntentExecutorHeaderOverrideRequests,
} from "@ledgerhq/live-dmk-shared";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { useDeviceBlocked } from "~/renderer/components/DeviceAction/DeviceBlocker";
import type { InitializerConfig } from "./DeviceContextInitializerComponentLWD";
import type { InitializationInput } from "./types";
import {
  trackAppReady,
  trackDeviceflowCanceled,
  trackDeviceflowCompleted,
  trackDeviceflowStarted,
  trackDrawerCloseButtonClicked,
} from "./utils/trackDeviceIntent";

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

type PreventableEvent = Pick<Event, "preventDefault">;

export type DeviceIntentExecutorLWDViewModel<JobState, Input, ExtraProps, Result = undefined> = {
  wrappedProps: Props<JobState, Input, ExtraProps, Result>;
  hasHeaderOverride: boolean;
  headerContextValue: DeviceIntentExecutorHeaderContextValue;
  onOpenChange: (open: boolean) => void;
  /**
   * Tracks the "Close" `button_clicked` event when the dialog header close button is pressed.
   * Wired to `DialogHeader.onClose` so tracking reflects real user intent, unlike
   * `onOpenChange` which can fire for any closing reason.
   */
  onHeaderClosePressed: (() => void) | undefined;
  /**
   * Tracks the "Close" `button_clicked` event when the dialog overlay is pressed.
   * Wired to `DialogContent.onPointerDownOutside`.
   */
  onOverlayDismiss: (event: PreventableEvent) => void;
  /**
   * Tracks the "Close" `button_clicked` event when Escape is pressed.
   * Wired to `DialogContent.onEscapeKeyDown`.
   */
  onEscapeKeyDown: (event: PreventableEvent) => void;
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

export function useDeviceIntentExecutorLWDViewModel<
  JobState,
  Input,
  ExtraProps,
  Result = undefined,
>(
  props: Props<JobState, Input, ExtraProps, Result>,
): DeviceIntentExecutorLWDViewModel<JobState, Input, ExtraProps, Result> {
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
  const { hasHeaderOverride, headerContextValue } = useDeviceIntentExecutorHeaderOverrideRequests();
  const isDeviceBlocked = useDeviceBlocked();

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
    trackDeviceflowStarted({ sourceFlow, extraProperties: analyticsProperties });
  }, [enabled, sourceFlow, analyticsProperties]);

  const wrappedOnExecutorStateChanged = useCallback(
    (state: ExecutorState) => {
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

  const trackClose = useCallback(() => {
    trackDrawerCloseButtonClicked({ sourceFlow, extraProperties: analyticsProperties });
  }, [sourceFlow, analyticsProperties]);

  const wrappedOnUserCancel = useCallback(() => {
    if (!cancelTrackedRef.current) {
      cancelTrackedRef.current = true;
      if (!initializationCompletedRef.current) {
        trackDeviceflowCanceled({ sourceFlow, extraProperties: analyticsProperties });
      }
    }
    onUserCancel();
  }, [onUserCancel, sourceFlow, analyticsProperties]);

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !isDeviceBlocked) {
        wrappedOnUserCancel();
      }
    },
    [isDeviceBlocked, wrappedOnUserCancel],
  );

  const onOverlayDismiss = useCallback(
    (event: PreventableEvent) => {
      if (isDeviceBlocked) {
        event.preventDefault();
        return;
      }
      trackClose();
    },
    [isDeviceBlocked, trackClose],
  );

  const onEscapeKeyDown = useCallback(
    (event: PreventableEvent) => {
      if (isDeviceBlocked) {
        event.preventDefault();
        return;
      }
      trackClose();
    },
    [isDeviceBlocked, trackClose],
  );

  return {
    hasHeaderOverride,
    headerContextValue,
    wrappedProps: {
      ...props,
      onExecutorStateChanged: wrappedOnExecutorStateChanged,
      onUserCancel: wrappedOnUserCancel,
    },
    onOpenChange,
    onHeaderClosePressed: isDeviceBlocked ? undefined : trackClose,
    onOverlayDismiss,
    onEscapeKeyDown,
  };
}
