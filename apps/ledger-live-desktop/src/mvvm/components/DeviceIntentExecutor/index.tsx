import React from "react";
import {
  DeviceIntentExecutor,
  type DeviceIntentExecutorProps,
  type ExecutorPlatformConfiguration,
} from "@ledgerhq/device-intent";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { DialogBackgroundToneProvider } from "LLD/components/DialogBackgroundGradient";
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

type Props<JobState, Input, ExtraProps> = DeviceIntentExecutorProps<
  JobState,
  Input,
  ExtraProps,
  InitializationInput
> & {
  initializerConfig?: InitializerConfig;
};

const platformConfig: ExecutorPlatformConfiguration<InitializationInput, InitializerConfig> = {
  DeviceConnectionComponent: DeviceConnectionComponentLWD,
  DeviceContextInitializerComponent: DeviceContextInitializerComponentLWD,
  DeviceDisconnectedComponent: DeviceDisconnected,
  IntentErrorComponent: IntentError,
  InvalidOperationComponent: InvalidOperation,
};

export function DeviceIntentExecutorLWD<JobState, Input, ExtraProps>(
  props: Props<JobState, Input, ExtraProps>,
): React.ReactElement | null {
  const { wrappedProps, onOpenChange, onClose } = useDeviceIntentExecutorLWDViewModel(props);

  if (!wrappedProps.enabled) return null;

  return (
    <Dialog open={wrappedProps.enabled} onOpenChange={onOpenChange} height="fit">
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[90vh] w-[400px] bg-base p-0"
        data-testid="device-intent-executor-dialog"
      >
        <DialogBackgroundToneProvider>
          <DialogHeader density="compact" onClose={onClose} className="!mb-0" />
          <DialogBody className="!mb-0 flex min-h-0 flex-col px-24 pb-24">
            <DeviceIntentExecutor
              {...wrappedProps}
              platformConfig={platformConfig}
              initializerConfig={wrappedProps.initializerConfig}
            />
          </DialogBody>
        </DialogBackgroundToneProvider>
      </DialogContent>
    </Dialog>
  );
}
