import type { ConnectedDevice, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import type { DeviceModelId } from "@ledgerhq/types-devices";
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
  /** ConnectedDevice */
  connectedDevice: ConnectedDevice;
  /** Legacy device identifier, usable by existing `withDevice` / `DeviceAction` flows. */
  compatDeviceId: string;
  compatDeviceModelId: DeviceModelId;
  compatDeviceName: string;
  compatDeviceWired: boolean;
};

// ---- Device Context ----

/**
 * Normalised information produced once the initializer has established the
 * device context. Passed to each intent's job alongside the connection result.
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
 * @typeParam Input - Data provided to the job at runtime (default `undefined`).
 */
export type Job<JobState, Input = undefined> = (params: {
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
 * @typeParam Input - Data provided to the job at runtime (default `undefined`).
 */
export interface IntentDefinition<JobState, Input = undefined> {
  /** Human-readable label identifying this intent (used for logging / debugging). */
  readonly label: string;
  /** Whether this intent requires an active device connection to run its job. */
  readonly requiresConnectedDevice: boolean;
  /** When `true`, the executor handles device lock/unlock transitions on behalf of the job. */
  readonly delegateDeviceLockStateHandlingToExecutor: boolean;
  /** The execution logic for this intent. */
  readonly job: Job<JobState, Input>;
}

/**
 * Platform-specific definition of an intent, extending {@link IntentDefinition}
 * with the React component used to render the job's state on a given platform.
 *
 * This is the unit of reusability **within** a single platform (e.g. all LWM
 * flows can share the same platform definition for "sign transaction").
 *
 * @typeParam JobState - Discriminated union of states emitted by the job.
 * @typeParam Input - Data provided to the job at runtime (default `undefined`).
 * @typeParam ExtraProps - Additional props forwarded to the component by the caller.
 */
export interface IntentPlatformDefinition<JobState, Input = undefined, ExtraProps = void>
  extends IntentDefinition<JobState, Input> {
  /** React component that renders the current {@link JobState}. */
  readonly component: React.ComponentType<{
    jobState: JobState | undefined;
    extraProps: ExtraProps;
  }>;
}

/**
 * Optional lifecycle callbacks attached directly to a runtime {@link Intent}.
 *
 * When present, these are called by the executor **before** the corresponding
 * executor-level callbacks (`DeviceIntentExecutorProps.onIntentJob*`), allowing
 * intent-specific reactions (e.g. storing a derived address) to run before
 * cross-cutting executor callbacks.
 *
 * @typeParam JobState - Discriminated union of states emitted by the job.
 */
export type IntentListeners<JobState> = {
  /** Called when the job observable emits a new state. */
  readonly onJobStateChanged?: (jobState: JobState) => void;
  /** Called when the job observable completes. */
  readonly onJobComplete?: () => void;
  /** Called when the job observable errors. */
  readonly onJobError?: (error: unknown) => void;
};

/**
 * Runtime instance of an intent, created from an {@link IntentPlatformDefinition}
 * and concrete input via {@link createIntent}.
 *
 * This is the object actually passed to the `DeviceIntentExecutor`.
 *
 * @typeParam JobState - Discriminated union of states emitted by the job.
 * @typeParam Input - Data provided to the job at runtime (default `undefined`).
 * @typeParam ExtraProps - Additional props forwarded to the component by the caller.
 */
export interface Intent<JobState, Input = undefined, ExtraProps = void>
  extends IntentPlatformDefinition<JobState, Input, ExtraProps> {
  /** Unique identifier for this runtime instance, useful for logging and debugging. */
  readonly uuid: string;
  /** Concrete input passed to the job when the executor runs this intent. */
  readonly input: Input;
  /** Called when the job observable emits a new state. Fires before executor-level callback. */
  readonly onJobStateChanged?: (jobState: JobState) => void;
  /** Called when the job observable completes. Fires before executor-level callback. */
  readonly onJobComplete?: () => void;
  /** Called when the job observable errors. Fires before executor-level callback. */
  readonly onJobError?: (error: unknown) => void;
}

// ---- Helpers ----

/**
 * Instantiate a runtime {@link Intent} from an {@link IntentPlatformDefinition},
 * concrete input and optional lifecycle listeners.
 *
 * Each call generates a new `uuid` so intent instances can be told apart in
 * logs and debugging, even when the same definition is reused.
 */
export function createIntent<JobState, Input, ExtraProps>(
  definition: IntentPlatformDefinition<JobState, Input, ExtraProps>,
  ...args: Input extends undefined
    ? [input?: undefined, listeners?: IntentListeners<JobState>]
    : [input: Input, listeners?: IntentListeners<JobState>]
): Intent<JobState, Input, ExtraProps> {
  const [input, listeners] = args;
  return {
    ...definition,
    uuid: uuidv4(),
    input: input as Input, // eslint-disable-line @typescript-eslint/consistent-type-assertions
    ...listeners,
  };
}
