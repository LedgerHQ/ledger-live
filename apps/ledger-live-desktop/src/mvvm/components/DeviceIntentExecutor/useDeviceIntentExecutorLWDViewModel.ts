import { useCallback } from "react";
import type { DeviceIntentExecutorProps } from "@ledgerhq/device-intent";
import type { InitializerConfig } from "./DeviceContextInitializerComponentLWD";
import type { InitializationInput } from "./types";

type Props<JobState, Input, ExtraProps> = DeviceIntentExecutorProps<
  JobState,
  Input,
  ExtraProps,
  InitializationInput
> & {
  initializerConfig?: InitializerConfig;
};

export type DeviceIntentExecutorLWDViewModel<JobState, Input, ExtraProps> = {
  wrappedProps: Props<JobState, Input, ExtraProps>;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
};

export function useDeviceIntentExecutorLWDViewModel<JobState, Input, ExtraProps>(
  props: Props<JobState, Input, ExtraProps>,
): DeviceIntentExecutorLWDViewModel<JobState, Input, ExtraProps> {
  const { onUserCancel } = props;

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onUserCancel();
      }
    },
    [onUserCancel],
  );

  return {
    wrappedProps: props,
    onOpenChange,
    onClose: onUserCancel,
  };
}
