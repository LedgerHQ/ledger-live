import React from "react";
import {
  DeviceIntentExecutor,
  type DeviceIntentExecutorProps,
  type ExecutorPlatformConfiguration,
} from "@ledgerhq/device-intent";
import { Text } from "@ledgerhq/native-ui";
import QueuedDrawer from "~/components/QueuedDrawer";
import DeviceConnectionComponentLWM from "./DeviceConnectionComponentLWM";
import DeviceContextInitializerComponentLWM from "./DeviceContextInitializerComponentLWM";
import ErrorComponentLWM from "./ErrorComponentLWM";
import InvalidOperationComponentLWM from "./InvalidOperationComponentLWM";

type Props<JobState, Input, ExtraProps> = DeviceIntentExecutorProps<JobState, Input, ExtraProps>;

const platformConfig: ExecutorPlatformConfiguration = {
  DeviceConnectionComponent: DeviceConnectionComponentLWM,
  DeviceContextInitializerComponent: DeviceContextInitializerComponentLWM,
  ConnectionErrorComponent: ErrorComponentLWM,
  InitializationErrorComponent: ErrorComponentLWM,
  IntentErrorComponent: ErrorComponentLWM,
  InvalidOperationComponent: InvalidOperationComponentLWM,
};

/**
 * NOTE: this is a work in progress. It does not yet follow mvvm architecture and has no tests,
 * the point for now it to allow manual testing of the DeviceIntentExecutor component.
 *
 * Initial implementation of the DeviceIntentExecutor for LWM.
 *
 * TODO (final version):
 * - Use Lumen UI components instead of hardcoded Native UI components
 * - MVVM architecture
 * - Tests
 */
export function DeviceIntentExecutorLWM<JobState, Input, ExtraProps>(
  props: Props<JobState, Input, ExtraProps>,
): React.ReactElement {
  return (
    <QueuedDrawer
      isRequestingToBeOpened={props.enabled}
      onClose={props.onUserCancel}
      noCloseButton={!props.cancellableUI}
      preventBackdropClick={!props.cancellableUI}
    >
      <Text variant="h5" mb={4}>
        Device Intent Executor
      </Text>
      <DeviceIntentExecutor {...props} platformConfig={platformConfig} />
    </QueuedDrawer>
  );
}
