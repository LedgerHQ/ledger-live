import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ExecutorState, Intent } from "@features/platform-device-intent";
import { normalizeError } from "./internals";
import type { PreparedDeviceIntentSignRequest } from "./types";

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
  createSignatureIntent: (input: IntentInput) => Intent<JobState, IntentInput, ExtraProps>;
  getSignedResult: (jobState: JobState) => Result | undefined;
  onSuccess: (result: Result) => void;
  onError: (error: Error) => void;
  onCancel: () => void;
  onClose: () => void;
}>;

export type UseDeviceIntentSignRequestResult<
  JobState,
  IntentInput extends object,
  ExtraProps,
  InitInput,
> = Readonly<{
  deviceInitializationInput: InitInput | null;
  signatureIntent: Intent<JobState, IntentInput, ExtraProps> | null;
  onIntentJobStateChanged: (jobState: JobState) => void;
  onIntentJobComplete: () => void;
  onIntentJobError: (error: unknown) => void;
  onExecutorStateChanged: (executorState: ExecutorState) => void;
  onUserCancel: () => void;
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
  getSignedResult,
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
>): UseDeviceIntentSignRequestResult<JobState, IntentInput, ExtraProps, InitInput> {
  const [deviceInitializationInput, setDeviceInitializationInput] = useState<InitInput | null>(
    null,
  );
  const [intentInput, setIntentInput] = useState<IntentInput | null>(null);
  const signedResultRef = useRef<Result | undefined>(undefined);
  const lastJobErrorRef = useRef<Error | null>(null);
  const settledRef = useRef(false);

  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onCancelRef = useRef(onCancel);
  const onCloseRef = useRef(onClose);
  const prepareRef = useRef(prepare);
  const getSignedResultRef = useRef(getSignedResult);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    onCancelRef.current = onCancel;
    onCloseRef.current = onClose;
    prepareRef.current = prepare;
    getSignedResultRef.current = getSignedResult;
  }, [onSuccess, onError, onCancel, onClose, prepare, getSignedResult]);

  const settle = useCallback((callback: () => void) => {
    if (settledRef.current) return;
    settledRef.current = true;
    callback();
    onCloseRef.current();
  }, []);

  useEffect(() => {
    let cancelled = false;
    signedResultRef.current = undefined;
    lastJobErrorRef.current = null;
    settledRef.current = false;
    // Clear the previous prepare so the dialog stays closed until the new one finishes.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- invalidate stale prepare on request change
    setDeviceInitializationInput(null);
    setIntentInput(null);

    prepareRef
      .current(request)
      .then(prepared => {
        if (cancelled) return;
        setDeviceInitializationInput(prepared.deviceInitializationInput);
        setIntentInput(prepared.intentInput);
      })
      .catch(error => {
        if (cancelled) return;
        settle(() => onErrorRef.current(normalizeError(error)));
      });

    return () => {
      cancelled = true;
    };
  }, [request, settle]);

  const signatureIntent = useMemo(
    () => (intentInput !== null ? createSignatureIntent(intentInput) : null),
    [intentInput, createSignatureIntent],
  );

  const onIntentJobStateChanged = useCallback((jobState: JobState) => {
    lastJobErrorRef.current = null;
    const signedResult = getSignedResultRef.current(jobState);
    if (signedResult !== undefined) {
      signedResultRef.current = signedResult;
    }
  }, []);

  const onIntentJobComplete = useCallback(() => {
    const signedResult = signedResultRef.current;
    if (signedResult === undefined) {
      settle(() => onErrorRef.current(new Error("Signing completed without a signed result")));
      return;
    }
    settle(() => onSuccessRef.current(signedResult));
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

  const onUserCancel = useCallback(() => {
    const signedResult = signedResultRef.current;
    if (signedResult !== undefined) {
      settle(() => onSuccessRef.current(signedResult));
      return;
    }
    if (lastJobErrorRef.current) {
      const error = lastJobErrorRef.current;
      settle(() => onErrorRef.current(error));
      return;
    }
    settle(() => onCancelRef.current());
  }, [settle]);

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
