import React from "react";
import {
  type DeviceIntentExecutorProps,
  type ExecutorPlatformConfiguration,
} from "@features/platform-device-intent";
import { DeviceIntentExecutor } from "@features/platform-device-intent/react";
import {
  DeviceIntentExecutorHeaderContext,
  DeviceIntentTrackingProvider,
  OverrideDeviceIntentExecutorHeader,
  type DeviceIntentTrackingProperties,
  type SourceFlow,
} from "@ledgerhq/live-dmk-shared";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { DialogBackgroundToneProvider } from "@shared/ui-info-state";
import { DeviceDisconnected } from "./components/DeviceDisconnected";
import { IntentError } from "./components/IntentError";
import { InvalidOperation } from "./components/InvalidOperation";
import DeviceConnectionComponentLWD from "./DeviceConnectionComponentLWD";
import DeviceContextInitializerComponentLWD, {
  InitializerConfig,
} from "./DeviceContextInitializerComponentLWD";
import type { InitializationInput } from "./types";
import { useDeviceIntentExecutorLWDViewModel } from "./useDeviceIntentExecutorLWDViewModel";

export {
  buildDeviceInitializationInput,
  type BuildDeviceInitializationInputParams,
} from "./DeviceContextInitializerComponentLWD/utils/buildDeviceInitializationInput";
export type { InitializationInput } from "./types";
export { ContinueOnDevice } from "./components/DeviceGenericStates/ContinueOnDevice";
export { RetryableDeviceLocked } from "./components/DeviceGenericStates/RetryableDeviceLocked";
export { UnlockDevice } from "./components/DeviceGenericStates/UnlockDevice";
export type { DeviceIntentTrackingProperties, SourceFlow } from "@ledgerhq/live-dmk-shared";

type Props<JobState, Input, ExtraProps, Result = undefined> = DeviceIntentExecutorProps<
  JobState,
  Input,
  ExtraProps,
  InitializationInput,
  Result
> & {
  initializerConfig?: InitializerConfig;
  /**
   * Originating user intent that initiated the device flow. Required for analytics.
   */
  sourceFlow: SourceFlow;
  /**
   * Generic analytics bag merged into the deviceUxV2 funnel events emitted by this flow.
   */
  analyticsProperties?: DeviceIntentTrackingProperties;
};

const platformConfig: ExecutorPlatformConfiguration<InitializationInput, InitializerConfig> = {
  DeviceConnectionComponent: DeviceConnectionComponentLWD,
  DeviceContextInitializerComponent: DeviceContextInitializerComponentLWD,
  DeviceDisconnectedComponent: DeviceDisconnected,
  IntentErrorComponent: IntentError,
  InvalidOperationComponent: InvalidOperation,
};

const emptyAnalyticsProperties: DeviceIntentTrackingProperties = {};

export function DeviceIntentExecutorLWD<JobState, Input, ExtraProps, Result = undefined>(
  props: Props<JobState, Input, ExtraProps, Result>,
): React.ReactElement | null {
  const {
    wrappedProps,
    hasHeaderOverride,
    headerContextValue,
    onOpenChange,
    onHeaderClosePressed,
    onOverlayDismiss,
    onEscapeKeyDown,
  } = useDeviceIntentExecutorLWDViewModel(props);
  const analyticsProperties = props.analyticsProperties ?? emptyAnalyticsProperties;
  const trackingContextValue = React.useMemo(
    () => ({ sourceFlow: props.sourceFlow, analyticsProperties }),
    [props.sourceFlow, analyticsProperties],
  );

  if (!wrappedProps.enabled) return null;

  return (
    <Dialog open={wrappedProps.enabled} onOpenChange={onOpenChange} height="fit">
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[90vh] w-[400px] bg-base p-0"
        data-testid="device-intent-executor-dialog"
        onPointerDownOutside={onOverlayDismiss}
        onEscapeKeyDown={onEscapeKeyDown}
      >
        <DialogBackgroundToneProvider>
          <DeviceIntentTrackingProvider value={trackingContextValue}>
            <DeviceIntentExecutorHeaderContext.Provider value={headerContextValue}>
              {!hasHeaderOverride && (
                <DialogHeader density="compact" onClose={onHeaderClosePressed} className="!mb-0" />
              )}
              <DialogBody className="!mb-0 flex min-h-0 flex-col px-24 pb-24">
                <DeviceIntentExecutor
                  {...wrappedProps}
                  platformConfig={platformConfig}
                  initializerConfig={wrappedProps.initializerConfig}
                />
              </DialogBody>
            </DeviceIntentExecutorHeaderContext.Provider>
          </DeviceIntentTrackingProvider>
        </DialogBackgroundToneProvider>
      </DialogContent>
    </Dialog>
  );
}
