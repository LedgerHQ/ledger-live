import type React from "react";
import type {
  DeviceConnectionParams,
  DeviceConnectionResult,
  DeviceExtractedContext,
} from "./core";
import type { ExecutorState } from "./executor";

// ---- Types ----

export type IntentExecutionSnapshot<JobState, ExtraProps> = {
  intentComponent: React.ComponentType<{
    jobState: JobState | undefined;
    extraProps: ExtraProps;
  }>;
  jobState: JobState | undefined;
  intentComponentExtraProps: ExtraProps;
};

export type DeviceIntentExecutorHookState<JobState, _Input, ExtraProps, InitInput> =
  | {
      phase: "deviceConnection";
      deviceConnectionParams: DeviceConnectionParams;
      onConnected: (result: DeviceConnectionResult) => void;
      onError: (error: unknown) => void;
    }
  | {
      phase: "connectionError";
      error: unknown;
      onRetry: () => void;
    }
  | {
      phase: "deviceInitialization";
      connectionResult: DeviceConnectionResult;
      deviceInitializationInput: InitInput;
      onContextInitialized: (ctx: DeviceExtractedContext) => void;
    }
  | {
      phase: "intentExecution";
      intentComponent: React.ComponentType<{
        jobState: JobState | undefined;
        extraProps: ExtraProps;
      }>;
      jobState: JobState | undefined;
      intentComponentExtraProps: ExtraProps;
    }
  | {
      phase: "intentError";
      error: unknown;
      onRetry: () => void;
    }
  | {
      phase: "invalidOperation";
      error: unknown;
      onClose: () => void;
    }
  | {
      phase: "idle";
      lastIntentSnapshot: IntentExecutionSnapshot<JobState, ExtraProps> | null;
    };

export type DeriveHookStateParams<JobState, ExtraProps, InitInput> = {
  deviceConnectionParams: DeviceConnectionParams;
  deviceInitializationInput: InitInput;
  connectionResult: DeviceConnectionResult | null;
  latestJobState: JobState | undefined;
  intentComponent: React.ComponentType<{
    jobState: JobState | undefined;
    extraProps: ExtraProps;
  }>;
  intentComponentExtraProps: ExtraProps;
  lastIntentSnapshot: IntentExecutionSnapshot<JobState, ExtraProps> | null;
  onConnected: (result: DeviceConnectionResult) => void;
  onConnectionError: (error: unknown) => void;
  onContextInitialized: (ctx: DeviceExtractedContext) => void;
  onRetry: () => void;
  onUserCancel: () => void;
};

export function deriveHookState<JobState, Input, ExtraProps, InitInput>(
  executorState: ExecutorState,
  params: DeriveHookStateParams<JobState, ExtraProps, InitInput>,
): DeviceIntentExecutorHookState<JobState, Input, ExtraProps, InitInput> {
  switch (executorState.type) {
    case "connectingDevice":
      return {
        phase: "deviceConnection",
        deviceConnectionParams: params.deviceConnectionParams,
        onConnected: params.onConnected,
        onError: params.onConnectionError,
      };
    case "connectingDeviceError":
      return {
        phase: "connectionError",
        error: executorState.error,
        onRetry: params.onRetry,
      };
    case "initializingDeviceContext":
      return {
        phase: "deviceInitialization",
        connectionResult: params.connectionResult!,
        deviceInitializationInput: params.deviceInitializationInput,
        onContextInitialized: params.onContextInitialized,
      };
    case "executingIntent":
      return {
        phase: "intentExecution",
        intentComponent: params.intentComponent,
        jobState: params.latestJobState,
        intentComponentExtraProps: params.intentComponentExtraProps,
      };
    case "executingIntentError":
      return {
        phase: "intentError",
        error: executorState.error,
        onRetry: params.onRetry,
      };
    case "invalidOperation":
      return {
        phase: "invalidOperation",
        error: executorState.error,
        onClose: params.onUserCancel,
      };
    case "idle":
      return { phase: "idle", lastIntentSnapshot: params.lastIntentSnapshot };
  }
}
