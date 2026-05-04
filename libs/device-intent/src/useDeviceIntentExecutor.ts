import { useCallback, useEffect, useRef, useState } from "react";
import { DeviceStatus, type DeviceSessionState } from "@ledgerhq/device-management-kit";
import type { DeviceConnectionResult, DeviceExtractedContext } from "./core";
import type { DeviceIntentExecutorProps, ExecutorState } from "./executor";
import {
  DefaultDeviceIntentExecutorStateMachine,
  type DeviceIntentExecutorStateMachine,
  type StateMachineConstructor,
} from "./DeviceIntentExecutorStateMachine";
import {
  deriveHookState,
  type DeviceIntentExecutorHookState,
  type IntentExecutionSnapshot,
} from "./deriveHookState";
export type { DeviceIntentExecutorHookState, IntentExecutionSnapshot } from "./deriveHookState";

// ---- Hook ----

/**
 * @internal Test-only options for dependency injection. Not intended for
 * production use — the defaults are correct for all runtime scenarios.
 */
type UseDeviceIntentExecutorOptions<JobState, Input, ExtraProps> = {
  /** Overrides the state machine constructor. Inject a mock class in unit tests. */
  StateMachineClass?: StateMachineConstructor<JobState, Input, ExtraProps>;
};

export function useDeviceIntentExecutor<JobState, Input, ExtraProps, InitInput>(
  props: DeviceIntentExecutorProps<JobState, Input, ExtraProps, InitInput>,
  {
    StateMachineClass = DefaultDeviceIntentExecutorStateMachine,
  }: UseDeviceIntentExecutorOptions<JobState, Input, ExtraProps> = {},
): DeviceIntentExecutorHookState<JobState, Input, ExtraProps, InitInput> | null {
  // ---- 1. Refs for props ----

  // -- Callback refs --
  // The SM listeners are created once and never replaced. Refs ensure they
  // always forward to the latest callback prop without stale closures.
  const onExecutorStateChangedRef = useRef(props.onExecutorStateChanged);
  onExecutorStateChangedRef.current = props.onExecutorStateChanged;
  const onIntentJobStateChangedRef = useRef(props.onIntentJobStateChanged);
  onIntentJobStateChangedRef.current = props.onIntentJobStateChanged;
  const onIntentJobCompleteRef = useRef(props.onIntentJobComplete);
  onIntentJobCompleteRef.current = props.onIntentJobComplete;
  const onIntentJobErrorRef = useRef(props.onIntentJobError);
  onIntentJobErrorRef.current = props.onIntentJobError;

  // -- Creation-time prop refs --
  // The SM is created once when `enabled` becomes true, using these refs to
  // read current prop values at creation time. Subsequent prop changes are
  // dispatched as SM events by the combined props->actions effect (section 6),
  // not by recreating the SM. This keeps `enabled` and the injected
  // `StateMachineClass` as the only dependencies of the SM lifecycle effect.
  const deviceConnectionParamsRef = useRef(props.deviceConnectionParams);
  deviceConnectionParamsRef.current = props.deviceConnectionParams;
  const deviceInitializationInputRef = useRef(props.deviceInitializationInput);
  deviceInitializationInputRef.current = props.deviceInitializationInput;
  const intentRef = useRef(props.intent);
  intentRef.current = props.intent;
  const intentComponentExtraPropsRef = useRef(props.intentComponentExtraProps);
  intentComponentExtraPropsRef.current = props.intentComponentExtraProps;

  // ---- 2. Internal state ----

  const smRef = useRef<DeviceIntentExecutorStateMachine<JobState, Input, ExtraProps> | null>(null);
  const [executorState, setExecutorState] = useState<ExecutorState>({
    type: "connectingDevice",
  });
  const [latestJobState, setLatestJobState] = useState<JobState | undefined>(undefined);
  const [connectionResult, setConnectionResult] = useState<DeviceConnectionResult | null>(null);
  const lastIntentSnapshotRef = useRef<IntentExecutionSnapshot<JobState, ExtraProps> | null>(null);

  // ---- 3. Callbacks ----

  const onConnected = useCallback((result: DeviceConnectionResult) => {
    setConnectionResult(result);
    smRef.current?.deviceConnected(result);
  }, []);

  const onConnectionError = useCallback((error: unknown) => {
    smRef.current?.connectionError(error);
  }, []);

  const onContextInitialized = useCallback((ctx: DeviceExtractedContext) => {
    smRef.current?.deviceContextInitialized(ctx);
  }, []);

  const onRetry = useCallback(() => {
    smRef.current?.retry();
  }, []);

  // ---- 4. SM lifecycle effect ----

  // Previous-value refs for change detection in the combined props->actions
  // effect (section 6). Declared here so the lifecycle effect can sync them
  // when creating a new SM, preventing the props->actions effect from firing
  // spuriously on the same render.
  const prevInitializationInputRef = useRef(props.deviceInitializationInput);
  const prevIntentRef = useRef(props.intent);

  useEffect(() => {
    if (!props.enabled) {
      smRef.current?.stop();
      smRef.current = null;
      setExecutorState({ type: "connectingDevice" });
      setConnectionResult(null);
      setLatestJobState(undefined);
      lastIntentSnapshotRef.current = null;
      return;
    }

    // Sync prev-value refs so the props->actions effect doesn't dispatch
    // events for props that were already used to create the SM.
    prevInitializationInputRef.current = deviceInitializationInputRef.current;
    prevIntentRef.current = intentRef.current;

    const sm = new StateMachineClass({
      deviceConnectionParams: deviceConnectionParamsRef.current,
      intent: intentRef.current,
      listeners: {
        onExecutorStateChanged: state => {
          setExecutorState(state);
          onExecutorStateChangedRef.current(state);
          if (state.type === "executingIntent") {
            setLatestJobState(undefined);
            lastIntentSnapshotRef.current = {
              intentComponent: intentRef.current.component,
              jobState: undefined,
              intentComponentExtraProps: intentComponentExtraPropsRef.current,
            };
          }
          if (state.type === "connectingDevice" || state.type === "connectingDeviceError") {
            setConnectionResult(null);
            setLatestJobState(undefined);
          }
        },
        onIntentJobStateChanged: (intent, jobState) => {
          setLatestJobState(jobState);
          onIntentJobStateChangedRef.current(jobState);
          lastIntentSnapshotRef.current = {
            intentComponent: intent.component,
            jobState,
            intentComponentExtraProps: intentComponentExtraPropsRef.current,
          };
        },
        onIntentJobComplete: () => onIntentJobCompleteRef.current(),
        onIntentJobError: (_intent, error) => onIntentJobErrorRef.current(error),
      },
    });
    smRef.current = sm;

    return () => {
      sm.stop();
      smRef.current = null;
    };
  }, [props.enabled, StateMachineClass]);

  // ---- 5. Device disconnection monitoring effect ----

  useEffect(() => {
    if (!connectionResult) return;
    const { dmk, sessionId } = connectionResult;
    const sub = dmk.getDeviceSessionState({ sessionId }).subscribe({
      next: (state: DeviceSessionState) => {
        if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) {
          smRef.current?.deviceDisconnected();
        }
      },
    });
    return () => sub.unsubscribe();
  }, [connectionResult]);

  // ---- 6. Props -> SM actions: combined effect ----
  // A single effect watches both deviceInitializationInput and intent. When both
  // change in the same render, reinitialize is dispatched first to ensure the SM
  // transitions safely (from idle: reinitialize -> deviceInitialization,
  // then setIntent is absorbed as a self-transition that updates the stored
  // intent).

  useEffect(() => {
    const sm = smRef.current;
    if (!sm) return;

    const initializationInputChanged =
      props.deviceInitializationInput !== prevInitializationInputRef.current;
    const intentChanged = props.intent !== prevIntentRef.current;

    prevInitializationInputRef.current = props.deviceInitializationInput;
    prevIntentRef.current = props.intent;

    // Reinitialize MUST be dispatched before intent.
    // From idle: reinitialize -> deviceInitialization, then
    //   setIntent is absorbed as a self-transition (updates stored intent).
    // From other states: the SM handles or drops each event per its
    //   transition table.
    if (initializationInputChanged) {
      sm.reinitialize();
    }
    if (intentChanged) sm.setIntent(props.intent);
  }, [props.deviceInitializationInput, props.intent]);

  // ---- 7. Cancel intent effect ----

  const prevCancelRef = useRef(props.cancelIntentRequestId);

  useEffect(() => {
    if (
      props.cancelIntentRequestId !== undefined &&
      props.cancelIntentRequestId !== prevCancelRef.current
    ) {
      smRef.current?.stopIntent();
    }
    prevCancelRef.current = props.cancelIntentRequestId;
  }, [props.cancelIntentRequestId]);

  // ---- 8. Return derived state ----

  if (!props.enabled) return null;

  return deriveHookState<JobState, Input, ExtraProps, InitInput>(executorState, {
    deviceConnectionParams: props.deviceConnectionParams,
    deviceInitializationInput: props.deviceInitializationInput,
    connectionResult,
    latestJobState,
    intentComponent: props.intent.component,
    intentComponentExtraProps: props.intentComponentExtraProps,
    lastIntentSnapshot: lastIntentSnapshotRef.current,
    onConnected,
    onConnectionError,
    onContextInitialized,
    onRetry,
    onUserCancel: props.onUserCancel,
  });
}
