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
    onClose: () => void;
  }>;
  jobState: JobState | undefined;
  intentComponentExtraProps: ExtraProps;
};

export type DeviceIntentExecutorHookState<JobState, _Input, ExtraProps, InitInput> =
  | {
      phase: "deviceConnection";
      deviceConnectionParams: DeviceConnectionParams;
      onConnected: (result: DeviceConnectionResult) => void;
      onClose: () => void;
    }
  | {
      phase: "deviceDisconnected";
      onRetry: () => void;
      onClose: () => void;
    }
  | {
      phase: "deviceInitialization";
      connectionResult: DeviceConnectionResult;
      deviceInitializationInput: InitInput;
      onContextInitialized: (ctx: DeviceExtractedContext) => void;
      onClose: () => void;
    }
  | {
      phase: "intentExecution";
      intentComponent: React.ComponentType<{
        jobState: JobState | undefined;
        extraProps: ExtraProps;
        onClose: () => void;
      }>;
      jobState: JobState | undefined;
      intentComponentExtraProps: ExtraProps;
      onClose: () => void;
    }
  | {
      phase: "intentError";
      error: unknown;
      onRetry: () => void;
      onClose: () => void;
    }
  | {
      phase: "invalidOperation";
      error: unknown;
      onClose: () => void;
    }
  | {
      phase: "idle";
      lastIntentSnapshot: IntentExecutionSnapshot<JobState, ExtraProps> | null;
      onClose: () => void;
    };

export type DeriveHookStateParams<JobState, ExtraProps, InitInput> = {
  deviceConnectionParams: DeviceConnectionParams;
  deviceInitializationInput: InitInput;
  connectionResult: DeviceConnectionResult | null;
  latestJobState: JobState | undefined;
  intentComponent: React.ComponentType<{
    jobState: JobState | undefined;
    extraProps: ExtraProps;
    onClose: () => void;
  }>;
  intentComponentExtraProps: ExtraProps;
  lastIntentSnapshot: IntentExecutionSnapshot<JobState, ExtraProps> | null;
  onConnected: (result: DeviceConnectionResult) => void;
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
        onClose: params.onUserCancel,
      };
    case "deviceDisconnected":
      return {
        phase: "deviceDisconnected",
        onRetry: params.onRetry,
        onClose: params.onUserCancel,
      };
    case "initializingDeviceContext":
      return {
        phase: "deviceInitialization",
        connectionResult: params.connectionResult!,
        deviceInitializationInput: params.deviceInitializationInput,
        onContextInitialized: params.onContextInitialized,
        onClose: params.onUserCancel,
      };
    case "executingIntent":
      return {
        phase: "intentExecution",
        intentComponent: params.intentComponent,
        jobState: params.latestJobState,
        intentComponentExtraProps: params.intentComponentExtraProps,
        onClose: params.onUserCancel,
      };
    case "executingIntentError":
      return {
        phase: "intentError",
        error: executorState.error,
        onRetry: params.onRetry,
        onClose: params.onUserCancel,
      };
    case "invalidOperation":
      return {
        phase: "invalidOperation",
        error: executorState.error,
        onClose: params.onUserCancel,
      };
    case "idle":
      return {
        phase: "idle",
        lastIntentSnapshot: params.lastIntentSnapshot,
        onClose: params.onUserCancel,
      };
  }
}
