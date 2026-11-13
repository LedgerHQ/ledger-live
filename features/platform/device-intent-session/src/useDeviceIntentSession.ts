import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  DeviceConnectionParams,
  DeviceIntentExecutorProps,
  Intent,
} from "@features/platform-device-intent";

const DEFAULT_DEVICE_CONNECTION_PARAMS: DeviceConnectionParams = { acceptedDeviceModelIds: [] };

export type DeviceIntentSessionEvent<JobState> =
  | { type: "jobStateChanged"; jobState: JobState }
  | { type: "userCancelled"; lastJobState: JobState | undefined };

export type DeviceIntentSessionOutcomes<JobState, Outcome> = Readonly<{
  /** Ends the session once the job completes, if its last state maps to an outcome. */
  fromJobState: (jobState: JobState) => Outcome | undefined;
  /** Ends the session when the user closes the executor, given the last state the job emitted. */
  fromUserCancel: (lastJobState: JobState | undefined) => Outcome;
  /** Ends the session when `buildSetupInput` rejects. */
  setupFailed: Outcome;
}>;

/**
 * `buildSetupInput` and `intent` are read once, on mount, so the executor never receives an
 * intent and a setup input that do not belong together. Remount the hook to start a new session.
 */
export type UseDeviceIntentSessionParams<JobState, Input, ExtraProps, SetupInput, Result, Outcome> =
  Readonly<{
    buildSetupInput: () => Promise<SetupInput>;
    intent: Intent<JobState, Input, ExtraProps, Result>;
    intentComponentExtraProps: ExtraProps;
    outcomes: DeviceIntentSessionOutcomes<JobState, Outcome>;
    onExit: (outcome: Outcome) => void;
    onTrack?: (event: DeviceIntentSessionEvent<JobState>) => void;
    onReady?: () => void;
    deviceConnectionParams?: DeviceConnectionParams;
  }>;

export type DeviceIntentSessionExecutorProps<JobState, Input, ExtraProps, SetupInput, Result> =
  Pick<
    DeviceIntentExecutorProps<JobState, Input, ExtraProps, SetupInput, Result>,
    | "enabled"
    | "deviceConnectionParams"
    | "deviceInitializationInput"
    | "intent"
    | "intentComponentExtraProps"
    | "onIntentJobStateChanged"
    | "onIntentJobComplete"
    | "onUserCancel"
  >;

type Session<JobState, Input, ExtraProps, SetupInput, Result> = Readonly<{
  setupInput: SetupInput;
  intent: Intent<JobState, Input, ExtraProps, Result>;
}>;

/**
 * Keeps connect, open-app and one intent on a single mounted executor.
 * Spread the returned props on the app's `DeviceIntentExecutor` wrapper, next to its `sourceFlow`.
 * Returns `undefined` until the setup input is built.
 */
export function useDeviceIntentSession<JobState, Input, ExtraProps, SetupInput, Result, Outcome>(
  params: UseDeviceIntentSessionParams<JobState, Input, ExtraProps, SetupInput, Result, Outcome>,
): DeviceIntentSessionExecutorProps<JobState, Input, ExtraProps, SetupInput, Result> | undefined {
  const { intentComponentExtraProps, deviceConnectionParams = DEFAULT_DEVICE_CONNECTION_PARAMS } =
    params;
  const [session, setSession] = useState<Session<
    JobState,
    Input,
    ExtraProps,
    SetupInput,
    Result
  > | null>(null);
  const latestParamsRef = useRef(params);
  latestParamsRef.current = params;
  const lastJobStateRef = useRef<JobState | undefined>(undefined);
  const completionOutcomeRef = useRef<Outcome | undefined>(undefined);
  const hasExitedRef = useRef(false);

  const exit = useCallback((outcome: Outcome) => {
    if (hasExitedRef.current) return;
    hasExitedRef.current = true;
    latestParamsRef.current.onExit(outcome);
  }, []);

  useEffect(() => {
    let isStale = false;
    const { buildSetupInput, intent } = latestParamsRef.current;
    buildSetupInput()
      .then(setupInput => {
        if (isStale) return;
        setSession({ setupInput, intent });
        latestParamsRef.current.onReady?.();
      })
      .catch(() => {
        if (!isStale) exit(latestParamsRef.current.outcomes.setupFailed);
      });
    return () => {
      isStale = true;
    };
  }, [exit]);

  const onIntentJobStateChanged = useCallback((jobState: JobState) => {
    if (hasExitedRef.current) return;
    lastJobStateRef.current = jobState;
    const { onTrack, outcomes } = latestParamsRef.current;
    completionOutcomeRef.current = outcomes.fromJobState(jobState);
    onTrack?.({ type: "jobStateChanged", jobState });
  }, []);

  const onIntentJobComplete = useCallback(() => {
    const outcome = completionOutcomeRef.current;
    if (outcome !== undefined) exit(outcome);
  }, [exit]);

  const onUserCancel = useCallback(() => {
    if (hasExitedRef.current) return;
    const lastJobState = lastJobStateRef.current;
    lastJobStateRef.current = undefined;
    const { onTrack, outcomes } = latestParamsRef.current;
    onTrack?.({ type: "userCancelled", lastJobState });
    exit(outcomes.fromUserCancel(lastJobState));
  }, [exit]);

  return useMemo(
    () =>
      session === null
        ? undefined
        : {
            enabled: true,
            deviceConnectionParams,
            deviceInitializationInput: session.setupInput,
            intent: session.intent,
            intentComponentExtraProps,
            onIntentJobStateChanged,
            onIntentJobComplete,
            onUserCancel,
          },
    [
      session,
      deviceConnectionParams,
      intentComponentExtraProps,
      onIntentJobStateChanged,
      onIntentJobComplete,
      onUserCancel,
    ],
  );
}
