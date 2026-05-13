import React from "react";
import type { DeviceIntentExecutorProps, ExecutorPlatformConfiguration } from "./executor";
import {
  useDeviceIntentExecutor,
  type DeviceIntentExecutorHookState,
} from "./useDeviceIntentExecutor";

type Props<JobState, Input, ExtraProps, InitInput, InitializerConfig> = DeviceIntentExecutorProps<
  JobState,
  Input,
  ExtraProps,
  InitInput
> & {
  platformConfig: ExecutorPlatformConfiguration<InitInput, InitializerConfig>;
  initializerConfig?: InitializerConfig;
  /**
   * @internal Test-only override. Inject a mock hook in unit tests.
   * Not intended for production use — the default is correct for all
   * runtime scenarios.
   */
  useExecutorHook?: (
    props: DeviceIntentExecutorProps<JobState, Input, ExtraProps, InitInput>,
  ) => DeviceIntentExecutorHookState<JobState, Input, ExtraProps, InitInput> | null;
};

export function DeviceIntentExecutor<JobState, Input, ExtraProps, InitInput, InitializerConfig>({
  useExecutorHook = useDeviceIntentExecutor,
  platformConfig,
  initializerConfig,
  ...executorProps
}: Props<JobState, Input, ExtraProps, InitInput, InitializerConfig>): React.ReactElement | null {
  const state = useExecutorHook(executorProps);
  if (!state) return null;

  const {
    DeviceConnectionComponent,
    DeviceContextInitializerComponent,
    ConnectionErrorComponent,
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
          deviceInitializationInput={state.deviceInitializationInput}
          onContextInitialized={state.onContextInitialized}
          config={initializerConfig}
        />
      );
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
