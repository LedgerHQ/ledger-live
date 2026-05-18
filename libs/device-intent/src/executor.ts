import type React from "react";
import type {
  DeviceConnectionParams,
  DeviceConnectionResult,
  DeviceExtractedContext,
  Intent,
} from "./core";

// ---- Platform-injected components ----

/**
 * React component responsible for device selection and connection.
 *
 * Injected into the executor via {@link ExecutorPlatformConfiguration} so each
 * platform (LWM / LWD) can provide its own implementation.
 */
export type DeviceConnectionComponent = React.ComponentType<{
  deviceConnectionParams: DeviceConnectionParams;
  onConnected: (connectionResult: DeviceConnectionResult) => void;
  onError: (error: unknown) => void;
}>;

/**
 * React component responsible for establishing the required device context
 * (installing/opening an app, performing derivation, etc.).
 *
 * Injected into the executor via {@link ExecutorPlatformConfiguration}.
 */
export type DeviceContextInitializerComponent<
  InitInput = void,
  InitializerConfig = void,
> = React.ComponentType<{
  connectionResult: DeviceConnectionResult;
  deviceInitializationInput: InitInput;
  onContextInitialized: (context: DeviceExtractedContext) => void;
  config?: InitializerConfig;
}>;

/**
 * React component rendered when an error occurs during one of the executor
 * phases (connection or intent execution).
 *
 * Injected into the executor via {@link ExecutorPlatformConfiguration}.
 */
export type ErrorComponent = React.ComponentType<{
  error: unknown;
  onRetry: () => void;
}>;

/**
 * React component rendered when the executor enters the terminal
 * `invalidOperation` state, signalling a caller-side orchestration bug.
 */
export type InvalidOperationComponent = React.ComponentType<{
  error: unknown;
  onClose: () => void;
}>;

/**
 * Platform-specific components injected into the base `DeviceIntentExecutor`.
 *
 * Platform wrappers (`LwmDeviceIntentExecutor`, `LwdDeviceIntentExecutor`)
 * supply this configuration so the executor itself remains platform-agnostic.
 */
export interface ExecutorPlatformConfiguration<InitInput = void, InitializerConfig = void> {
  DeviceConnectionComponent: DeviceConnectionComponent;
  DeviceContextInitializerComponent: DeviceContextInitializerComponent<
    InitInput,
    InitializerConfig
  >;
  ConnectionErrorComponent: ErrorComponent;
  IntentErrorComponent: ErrorComponent;
  InvalidOperationComponent: InvalidOperationComponent;
}

// ---- Executor state ----

/**
 * Observable state of the `DeviceIntentExecutor`, reported to the caller via
 * {@link DeviceIntentExecutorProps.onExecutorStateChanged}.
 */
export type ExecutorState =
  | { type: "connectingDevice" }
  | { type: "connectingDeviceError"; error: unknown }
  | { type: "initializingDeviceContext" }
  | { type: "executingIntent" }
  | { type: "executingIntentError"; error: unknown }
  | { type: "invalidOperation"; error: unknown }
  | { type: "idle" };

// ---- Executor props ----

/**
 * Props for the `DeviceIntentExecutor` component.
 *
 * The caller owns the business flow and drives the executor by changing these
 * props (e.g. swapping the current intent, updating the device initialization params).
 *
 * @typeParam JobState - Discriminated union of states emitted by the current intent's job.
 * @typeParam Input - Input type for the current intent's job.
 * @typeParam ExtraProps - Extra props forwarded to the intent's UI component.
 * @typeParam InitInput - Input type for the device context initializer.
 */
export interface DeviceIntentExecutorProps<JobState, Input, ExtraProps, InitInput = void> {
  /** Parameters for device selection / connection. */
  deviceConnectionParams: DeviceConnectionParams;
  /** Initialization input; changing it triggers a new device-context initialisation. */
  deviceInitializationInput: InitInput;
  /** Called whenever the executor's own lifecycle state changes. */
  onExecutorStateChanged: (executorState: ExecutorState) => void;
  /** The current intent to execute. */
  intent: Intent<JobState, Input, ExtraProps>;
  /** Extra props forwarded directly to the intent's UI component. */
  intentComponentExtraProps: ExtraProps;
  /** Called whenever the running job emits a new state. */
  onIntentJobStateChanged: (jobState: JobState) => void;
  /** On intent job complete */
  onIntentJobComplete: () => void;
  /** On intent job error */
  onIntentJobError: (error: unknown) => void;
  /** When `false` the executor is hidden and inactive; setting to `false` terminates any running job. */
  enabled: boolean;
  /** Whether the UI allows the user to cancel the current execution (e.g. close a bottom sheet). */
  cancellableUI: boolean;
  /** Called when the user cancels the current execution (e.g. closes a bottom sheet). */
  onUserCancel: () => void;
  /** Set to a new value to request cancellation of the ongoing job. */
  cancelIntentRequestId: string | undefined;
}
