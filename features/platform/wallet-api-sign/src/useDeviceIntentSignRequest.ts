import { useCallback, useEffect, useRef, useState } from "react";
import type { ExecutorState, Intent } from "@features/platform-device-intent";
import { failureToError, normalizeError } from "./internals";
import type { DeviceIntentSignFailure, PreparedDeviceIntentSignRequest } from "./types";

// A retry reconnects or restarts the job, which can take a while before the next job state.
const RETRY_STARTED_STATE_TYPES = new Set<ExecutorState["type"]>([
  "connectingDevice",
  "initializingDeviceContext",
  "executingIntent",
]);

export type UseDeviceIntentSignRequestParams<
  Request,
  JobState,
  IntentInput extends object,
  ExtraProps,
  Result,
  InitInput,
> = Readonly<{
  request: Request;
  prepare: (request: Request) => Promise<PreparedDeviceIntentSignRequest<InitInput, IntentInput>>;
  /** Must attach `onResult` to the intent: the signed result is only read from there. */
  createSignatureIntent: (
    input: IntentInput,
    onResult: (result: Result) => void,
  ) => Intent<JobState, IntentInput, ExtraProps, Result>;
  onSuccess: (result: Result) => void;
  onError: (error: Error) => void;
  onCancel: () => void;
  onClose: () => void;
}>;

export type UseDeviceIntentSignRequestResult<
  JobState,
  IntentInput extends object,
  ExtraProps,
  Result,
  InitInput,
> = Readonly<{
  deviceInitializationInput: InitInput | null;
  signatureIntent: Intent<JobState, IntentInput, ExtraProps, Result> | null;
  onIntentJobStateChanged: (jobState: JobState) => void;
  onIntentJobComplete: () => void;
  onIntentJobError: (error: unknown) => void;
  onExecutorStateChanged: (executorState: ExecutorState) => void;
  onUserCancel: (failure?: DeviceIntentSignFailure | null) => void;
}>;

export function useDeviceIntentSignRequest<
  Request,
  JobState,
  IntentInput extends object,
  ExtraProps,
  Result,
  InitInput,
>({
  request,
  prepare,
  createSignatureIntent,
  onSuccess,
  onError,
  onCancel,
  onClose,
}: UseDeviceIntentSignRequestParams<
  Request,
  JobState,
  IntentInput,
  ExtraProps,
  Result,
  InitInput
>): UseDeviceIntentSignRequestResult<JobState, IntentInput, ExtraProps, Result, InitInput> {
  const [deviceInitializationInput, setDeviceInitializationInput] = useState<InitInput | null>(
    null,
  );
  const [signatureIntent, setSignatureIntent] = useState<Intent<
    JobState,
    IntentInput,
    ExtraProps,
    Result
  > | null>(null);
  const signedResultRef = useRef<{ value: Result } | null>(null);
  const lastJobErrorRef = useRef<Error | null>(null);
  const settledRef = useRef(false);

  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onCancelRef = useRef(onCancel);
  const onCloseRef = useRef(onClose);
  const prepareRef = useRef(prepare);
  const createSignatureIntentRef = useRef(createSignatureIntent);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    onCancelRef.current = onCancel;
    onCloseRef.current = onClose;
    prepareRef.current = prepare;
    createSignatureIntentRef.current = createSignatureIntent;
  }, [onSuccess, onError, onCancel, onClose, prepare, createSignatureIntent]);

  const settle = useCallback((callback: () => void) => {
    if (settledRef.current) return;
    settledRef.current = true;
    callback();
    onCloseRef.current();
  }, []);

  useEffect(() => {
    let cancelled = false;
    signedResultRef.current = null;
    lastJobErrorRef.current = null;
    settledRef.current = false;
    // Clear the previous prepare so the dialog stays closed until the new one finishes.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- invalidate stale prepare on request change
    setDeviceInitializationInput(null);
    setSignatureIntent(null);

    prepareRef
      .current(request)
      .then(prepared => {
        if (cancelled) return;
        setDeviceInitializationInput(prepared.deviceInitializationInput);
        setSignatureIntent(
          createSignatureIntentRef.current(prepared.intentInput, result => {
            if (cancelled) return;
            signedResultRef.current = { value: result };
          }),
        );
      })
      .catch(error => {
        if (cancelled) return;
        settle(() => onErrorRef.current(normalizeError(error)));
      });

    return () => {
      cancelled = true;
    };
  }, [request, settle]);

  // Any job state after a job error comes from a retry, which replaces that error.
  const onIntentJobStateChanged = useCallback((_jobState: JobState) => {
    lastJobErrorRef.current = null;
  }, []);

  const onIntentJobComplete = useCallback(() => {
    const signedResult = signedResultRef.current;
    if (!signedResult) {
      settle(() => onErrorRef.current(new Error("Signing completed without a signed result")));
      return;
    }
    settle(() => onSuccessRef.current(signedResult.value));
  }, [settle]);

  // The executor owns the error screen; remember the error so dismissing returns it to the dApp.
  const onIntentJobError = useCallback((error: unknown) => {
    lastJobErrorRef.current = normalizeError(error);
  }, []);

  // A retry that reconnects the device emits no job state before it is closed: the failure
  // it replaces must not be returned for a close made during the reconnection.
  const onExecutorStateChanged = useCallback((executorState: ExecutorState) => {
    if (RETRY_STARTED_STATE_TYPES.has(executorState.type)) {
      lastJobErrorRef.current = null;
    }
  }, []);

  const onUserCancel = useCallback(
    (failure?: DeviceIntentSignFailure | null) => {
      const signedResult = signedResultRef.current;
      if (signedResult) {
        settle(() => onSuccessRef.current(signedResult.value));
        return;
      }
      const jobError = lastJobErrorRef.current;
      if (jobError) {
        settle(() => onErrorRef.current(jobError));
        return;
      }
      if (failure?.countsAsFailure) {
        settle(() => onErrorRef.current(failureToError(failure)));
        return;
      }
      settle(() => onCancelRef.current());
    },
    [settle],
  );

  return {
    deviceInitializationInput,
    signatureIntent,
    onIntentJobStateChanged,
    onIntentJobComplete,
    onIntentJobError,
    onExecutorStateChanged,
    onUserCancel,
  };
}
