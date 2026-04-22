import React from "react";
import type { DeviceIntentExecutorProps, ExecutorPlatformConfiguration } from "./executor";
import {
  useDeviceIntentExecutor,
  type DeviceIntentExecutorHookState,
} from "./useDeviceIntentExecutor";

type Props<JobState, Input, ExtraProps> = DeviceIntentExecutorProps<JobState, Input, ExtraProps> & {
  platformConfig: ExecutorPlatformConfiguration;
  /**
   * @internal Test-only override. Inject a mock hook in unit tests.
   * Not intended for production use — the default is correct for all
   * runtime scenarios.
   */
  useExecutorHook?: (
    props: DeviceIntentExecutorProps<JobState, Input, ExtraProps>,
  ) => DeviceIntentExecutorHookState<JobState, Input, ExtraProps> | null;
};

export function DeviceIntentExecutor<JobState, Input, ExtraProps>({
  useExecutorHook = useDeviceIntentExecutor,
  platformConfig,
  ...executorProps
}: Props<JobState, Input, ExtraProps>): React.ReactElement | null {
  const state = useExecutorHook(executorProps);
  if (!state) return null;

  const {
    DeviceConnectionComponent,
    DeviceContextInitializerComponent,
    ConnectionErrorComponent,
    InitializationErrorComponent,
    IntentErrorComponent,
    InvalidOperationComponent,
  } = platformConfig;

  switch (state.phase) {
    case "deviceConnection":
      return (
        <DeviceConnectionComponent
          deviceConnectionParams={state.deviceConnectionParams}
          onConnected={state.onConnected}
          onError={state.onError}
        />
      );
    case "connectionError":
      return <ConnectionErrorComponent error={state.error} onRetry={state.onRetry} />;
    case "deviceInitialization":
      return (
        <DeviceContextInitializerComponent
          connectionResult={state.connectionResult}
          requiredDeviceContext={state.requiredDeviceContext}
          onContextInitialized={state.onContextInitialized}
          onError={state.onError}
        />
      );
    case "initializationError":
      return <InitializationErrorComponent error={state.error} onRetry={state.onRetry} />;
    case "intentExecution": {
      const IntentComponent = state.intentComponent;
      return (
        <IntentComponent jobState={state.jobState} extraProps={state.intentComponentExtraProps} />
      );
    }
    case "intentError":
      return <IntentErrorComponent error={state.error} onRetry={state.onRetry} />;
    case "invalidOperation":
      return <InvalidOperationComponent error={state.error} onClose={state.onClose} />;
    case "idle": {
      if (state.lastIntentSnapshot) {
        const IntentComponent = state.lastIntentSnapshot.intentComponent;
        return (
          <IntentComponent
            jobState={state.lastIntentSnapshot.jobState}
            extraProps={state.lastIntentSnapshot.intentComponentExtraProps}
          />
        );
      }
      return null;
    }
  }
}
