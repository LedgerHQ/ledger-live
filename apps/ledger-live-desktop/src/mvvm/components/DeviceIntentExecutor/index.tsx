import React from "react";
import {
  type DeviceIntentExecutorProps,
  type ExecutorPlatformConfiguration,
} from "@features/platform-device-intent";
import { DeviceIntentExecutor as BaseDeviceIntentExecutor } from "@features/platform-device-intent/react";
import type {
  DeviceFlowFailure,
  DeviceIntentTrackingProperties,
  SourceFlow,
} from "@ledgerhq/live-dmk-shared";
import {
  DeviceIntentExecutorHeaderContext,
  DeviceIntentTrackingProvider,
  OverrideDeviceIntentExecutorHeader,
} from "@ledgerhq/live-dmk-shared/react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { DialogBackgroundToneProvider } from "@shared/ui-info-state/web";
import { DeviceDisconnected } from "./components/DeviceDisconnected";
import { IntentError } from "./components/IntentError";
import { InvalidOperation } from "./components/InvalidOperation";
import Connection from "./Connection";
import ContextInitializer, { InitializerConfig } from "./ContextInitializer";
import type { InitializationInput } from "./types";
import { useDeviceIntentExecutorViewModel } from "./useDeviceIntentExecutorViewModel";

export { buildDeviceInitializationInput } from "./ContextInitializer/utils/buildDeviceInitializationInput";
export type { InitializationInput } from "./types";
export { ContinueOnDevice } from "./components/DeviceGenericStates/ContinueOnDevice";
export { UserRefusedOnDevice } from "./components/DeviceGenericStates/UserRefusedOnDevice";
export type { SourceFlow } from "@ledgerhq/live-dmk-shared";

type Props<JobState, Input, ExtraProps, Result = undefined> = Omit<
  DeviceIntentExecutorProps<JobState, Input, ExtraProps, InitializationInput, Result>,
  "onUserCancel"
> & {
  /** Gets the error screen the user closed, if any. */
  onUserCancel: (failure: DeviceFlowFailure | null) => void;
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
  DeviceConnectionComponent: Connection,
  DeviceContextInitializerComponent: ContextInitializer,
  DeviceDisconnectedComponent: DeviceDisconnected,
  IntentErrorComponent: IntentError,
  InvalidOperationComponent: InvalidOperation,
};

export function DeviceIntentExecutor<JobState, Input, ExtraProps, Result = undefined>(
  props: Props<JobState, Input, ExtraProps, Result>,
): React.ReactElement | null {
  const {
    wrappedProps,
    hasHeaderOverride,
    headerContextValue,
    trackingContextValue,
    onOpenChange,
    onHeaderClosePressed,
    onOverlayDismiss,
    onEscapeKeyDown,
  } = useDeviceIntentExecutorViewModel(props);

  if (!wrappedProps.enabled) return null;

  return (
    <Dialog open={wrappedProps.enabled} onOpenChange={onOpenChange} height="fit">
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[90vh] w-[400px] p-0 text-base"
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
                <BaseDeviceIntentExecutor
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
