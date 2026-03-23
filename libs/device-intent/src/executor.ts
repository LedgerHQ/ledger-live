import type React from "react";
import type {
  DeviceConnectionParams,
  DeviceConnectionResult,
  Intent,
  RequiredDeviceContext,
} from "./core.js";

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
export type DeviceContextInitializerComponent = React.ComponentType<{
  connectionResult: DeviceConnectionResult;
  requiredDeviceContext: RequiredDeviceContext;
}>;

/**
 * Platform-specific components injected into the base `DeviceIntentExecutor`.
 *
 * Platform wrappers (`LwmDeviceIntentExecutor`, `LwdDeviceIntentExecutor`)
 * supply this configuration so the executor itself remains platform-agnostic.
 */
export interface ExecutorPlatformConfiguration {
  DeviceConnectionComponent: DeviceConnectionComponent;
  DeviceContextInitializerComponent: DeviceContextInitializerComponent;
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
  | { type: "initializingDeviceContextError"; error: unknown }
  | { type: "executingIntent" }
  | { type: "executingIntentError"; error: unknown }
  | { type: "cancellingIntent" }
  | { type: "idle" };

// ---- Executor props ----

/**
 * Props for the `DeviceIntentExecutor` component.
 *
 * The caller owns the business flow and drives the executor by changing these
 * props (e.g. swapping the current intent, updating the required context).
 *
 * @typeParam JobState - Discriminated union of states emitted by the current intent's job.
 * @typeParam Input - Input type for the current intent's job.
 * @typeParam ExtraProps - Extra props forwarded to the intent's UI component.
 */
export interface DeviceIntentExecutorProps<JobState, Input, ExtraProps> {
  /** Parameters for device selection / connection. */
  deviceConnectionParams: DeviceConnectionParams;
  /** Required device context; changing it triggers a new context initialisation. */
  requiredDeviceContext: RequiredDeviceContext;
  /** Called whenever the executor's own lifecycle state changes. */
  onExecutorStateChanged: (executorState: ExecutorState) => void;
  /** The current intent to execute. */
  intent: Intent<JobState, Input, ExtraProps>;
  /** Extra props forwarded directly to the intent's UI component. */
  intentComponentExtraProps: ExtraProps;
  /** Called whenever the running job emits a new state. */
  onIntentJobStateChanged: (jobState: JobState) => void;
  /** When `false` the executor is hidden and inactive; setting to `false` terminates any running job. */
  enabled: boolean;
  /** Whether the UI allows the user to cancel the current execution (e.g. close a bottom sheet). */
  cancellableUI: boolean;
  /** Set to a new value to request cancellation of the ongoing job. */
  cancelIntentRequestId: string | undefined;
}
