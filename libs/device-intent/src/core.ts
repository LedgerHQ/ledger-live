import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { DeviceId } from "@ledgerhq/client-ids/ids";
import type React from "react";
import type { Observable } from "rxjs";
import { v4 as uuidv4 } from "uuid";

// ---- Device Connection ----

/** Declarative parameters for device selection, passed to the executor. */
export type DeviceConnectionParams = {
  /** Restrict selection to specific device models. Empty array means all models are accepted. */
  acceptedDeviceModelIds: Array<DeviceModelId>;
};

/**
 * Result of a successful device connection, providing everything needed to
 * interact with the device during intent execution.
 */
export type DeviceConnectionResult = {
  /** Device Management Kit instance bound to the current session. */
  dmk: DeviceManagementKit;
  /** Active DMK session identifier. */
  sessionId: string;
  /** Legacy device identifier, usable by existing `withDevice` / `DeviceAction` flows. */
  compatDeviceId: DeviceId;
};

// ---- Device Context ----

/** Parameters for address derivation during device context initialisation. */
export type RequiresDerivation = {
  currencyId: string;
  path: string;
  derivationMode: string;
  forceFormat?: string;
};

/**
 * Declarative description of the device state that must be established before
 * an intent's job can run (e.g. which app must be open, which dependencies
 * must be installed).
 */
export type RequiredDeviceContext = {
  /** App to install and open on the device. */
  appName: string;
  /** Optional derivation to perform once the app is open. */
  requiresDerivation?: RequiresDerivation;
  /** Additional app names to install alongside the main app. */
  dependencies: string[];
  /** Fail initialisation if the device OS is not up to date. */
  requireLatestFirmware: boolean;
  /** When `true`, missing optional dependencies do not cause a failure. */
  allowPartialDependencies: boolean;
};

/**
 * Normalised information produced once the {@link RequiredDeviceContext} has
 * been established. Passed to each intent's job alongside the connection result.
 */
export type DeviceExtractedContext = {
  currentOsVersion: string;
  osUpdateAvailable: boolean;
  currentAppName: string;
  currentAppVersion: string;
  derivedAddress?: string;
};

// ---- Intents ----

/**
 * Execution logic for one step of a flow.
 *
 * A job is called with the connected device, the extracted device context and
 * step-specific input, and returns an `Observable` that emits typed state
 * updates (`JobState`) as it progresses.
 *
 * @typeParam JobState - Discriminated union of states emitted by this job.
 * @typeParam Input - Data provided to the job at runtime (default `void`).
 */
export type Job<JobState, Input = void> = (params: {
  deviceConnectionResult: DeviceConnectionResult;
  deviceExtractedContext: DeviceExtractedContext;
  input: Input;
}) => Observable<JobState>;

/**
 * Reusable, cross-platform definition of one step of a flow.
 *
 * Contains metadata and the {@link Job} implementation but no platform-specific
 * UI. This is the unit of reusability **across** LWM and LWD.
 *
 * @typeParam JobState - Discriminated union of states emitted by the job.
 * @typeParam Input - Data provided to the job at runtime (default `void`).
 */
export interface IntentDefinition<JobState, Input = void> {
  /** Human-readable label identifying this intent (used for logging / debugging). */
  label: string;
  /** Whether this intent requires an active device connection to run its job. */
  requiresConnectedDevice: boolean;
  /** When `true`, the executor handles device lock/unlock transitions on behalf of the job. */
  delegateDeviceLockStateHandlingToExecutor: boolean;
  /** The execution logic for this intent. */
  job: Job<JobState, Input>;
}

/**
 * Platform-specific definition of an intent, extending {@link IntentDefinition}
 * with the React component used to render the job's state on a given platform.
 *
 * This is the unit of reusability **within** a single platform (e.g. all LWM
 * flows can share the same platform definition for "sign transaction").
 *
 * @typeParam JobState - Discriminated union of states emitted by the job.
 * @typeParam Input - Data provided to the job at runtime (default `void`).
 * @typeParam ExtraProps - Additional props forwarded to the component by the caller.
 */
export interface IntentPlatformDefinition<JobState, Input = void, ExtraProps = void>
  extends IntentDefinition<JobState, Input> {
  /** React component that renders the current {@link JobState}. */
  component: React.ComponentType<{
    jobState: JobState;
    extraProps: ExtraProps;
  }>;
}

/**
 * Runtime instance of an intent, created from an {@link IntentPlatformDefinition}
 * and concrete input via {@link createIntent}.
 *
 * This is the object actually passed to the `DeviceIntentExecutor`.
 *
 * @typeParam JobState - Discriminated union of states emitted by the job.
 * @typeParam Input - Data provided to the job at runtime (default `void`).
 * @typeParam ExtraProps - Additional props forwarded to the component by the caller.
 */
export interface Intent<JobState, Input = void, ExtraProps = void>
  extends IntentPlatformDefinition<JobState, Input, ExtraProps> {
  /** Unique identifier for this runtime instance, used to key lifecycle effects. */
  uuid: string;
  /** Concrete input passed to the job when the executor runs this intent. */
  input: Input;
}

// ---- Helpers ----

/**
 * Instantiate a runtime {@link Intent} from an {@link IntentPlatformDefinition}
 * and concrete input.
 *
 * Each call generates a new `uuid` so the executor can distinguish successive
 * intents even when the same definition is reused.
 */
export const createIntent = <JobState, Input, ExtraProps>(
  definition: IntentPlatformDefinition<JobState, Input, ExtraProps>,
  input: Input,
): Intent<JobState, Input, ExtraProps> => ({
  ...definition,
  uuid: uuidv4(),
  input,
});
