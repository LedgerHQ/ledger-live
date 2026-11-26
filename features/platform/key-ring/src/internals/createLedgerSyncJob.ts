import {
  isDeviceDisconnectedError,
  type DeviceConnectionResult,
  type Job,
} from "@features/platform-device-intent";
import { Observable, type Subscriber } from "rxjs";
import type { KeyRingClient, KeyRingDeviceCallbacks } from "../types";
import type { LedgerSyncResultOrder } from "../intents/ledgerSyncResultOrder";
import { isUserRefusedOnDevice, mapLedgerSyncErrorToFailure } from "../intents/failure";
import type {
  LedgerSyncAwaitingDeviceConfirmationJobState,
  LedgerSyncCompletedJobState,
  LedgerSyncDeviceRejectedJobState,
  LedgerSyncJobState,
  LedgerSyncPendingJobState,
  LedgerSyncProcessingJobState,
} from "../intents/jobState";
import { toError } from "./errors";

/** Emits the terminal `failed` state for `error` and completes the job. */
export function failJob(subscriber: JobSubscriber, error: unknown): void {
  subscriber.next(mapLedgerSyncErrorToFailure(error));
  subscriber.complete();
}

/** Hands `result` to `onResult`, then emits `completed`; a throwing `onResult` errors the job. */
export function completeJob<Result>(
  subscriber: JobSubscriber,
  onResult: (result: Result) => void,
  result: Result,
): void {
  try {
    onResult(result);
  } catch (error) {
    subscriber.error(error);
    return;
  }
  subscriber.next(COMPLETED);
  subscriber.complete();
}

/** The device part is done, so the app must still store the result once nobody watches the job. */
export function deliverLateResult<Result>(
  onResult: (result: Result) => void,
  result: Result,
): void {
  try {
    onResult(result);
  } catch (error) {
    // The subscriber is closed, so the throw cannot end the job: only the log reports it.
    console.error("Ledger Sync: storing a late result failed", error);
  }
}

/** The session client of the run, or undefined after failing the job with the build error. */
export function tryCreateSessionClient(
  client: KeyRingClient,
  { dmk, sessionId }: DeviceConnectionResult,
  subscriber: JobSubscriber,
): KeyRingClient | undefined {
  try {
    return client.forDeviceSession({ dmk, sessionId });
  } catch (error) {
    failJob(subscriber, error);
    return undefined;
  }
}

/** Device callbacks that emit the confirmation states, only while the run is the current one. */
export function createDeviceCallbacks(
  subscriber: JobSubscriber,
  { connectedDevice, compatDeviceName }: DeviceConnectionResult,
  isCurrentRun: () => boolean,
): KeyRingDeviceCallbacks {
  return {
    onStartRequestUserInteraction() {
      if (!isCurrentRun()) return;
      const awaiting: LedgerSyncAwaitingDeviceConfirmationJobState = {
        type: "awaiting-device-confirmation",
        deviceModelId: connectedDevice.modelId,
        deviceName: compatDeviceName,
      };
      subscriber.next(awaiting);
    },
    onEndRequestUserInteraction() {
      if (isCurrentRun()) subscriber.next(PROCESSING);
    },
  };
}

/** Routes a call error: a disconnection errors the job, a refusal offers `retry`, the rest fail. */
export function handleCallError(
  subscriber: JobSubscriber,
  error: unknown,
  retry: () => void,
): void {
  if (isDeviceDisconnectedError(error)) {
    subscriber.error(error);
    return;
  }
  if (isUserRefusedOnDevice(error)) {
    const rejected: LedgerSyncDeviceRejectedJobState = {
      type: "device-rejected",
      error: toError(error),
      retry,
    };
    subscriber.next(rejected);
    return;
  }
  failJob(subscriber, error);
}

/**
 * The DIE job of one Ledger Sync device call. Builds the client once per run, so a retry after a
 * refusal reuses it and its access token.
 */
export function createLedgerSyncJob<Input extends LedgerSyncJobInput, Result>(
  call: LedgerSyncDeviceCall<Input, Result>,
): Job<LedgerSyncJobState, Input, Result> {
  return ({ deviceConnectionResult, input, onResult }) =>
    new Observable<LedgerSyncJobState>(subscriber => {
      const created = tryCreateSessionClient(input.client, deviceConnectionResult, subscriber);
      if (!created) return;
      const client: KeyRingClient = created;

      let runToken = 0;

      function run() {
        const token = ++runToken;
        const ticket = input.resultOrder.take();
        function isLatestRun() {
          return token === runToken;
        }
        function isCurrentRun() {
          return !subscriber.closed && isLatestRun();
        }
        function retry() {
          if (isCurrentRun()) run();
        }
        const callbacks = createDeviceCallbacks(subscriber, deviceConnectionResult, isCurrentRun);

        subscriber.next(PENDING);
        (async () => call({ client, input, callbacks }))().then(
          result => {
            if (!isLatestRun()) return;
            if (subscriber.closed) {
              if (input.resultOrder.isStale(ticket)) return;
              input.resultOrder.markDelivered(ticket);
              deliverLateResult(onResult, result);
              return;
            }
            input.resultOrder.markDelivered(ticket);
            completeJob(subscriber, onResult, result);
          },
          (error: unknown) => {
            if (isCurrentRun()) handleCallError(subscriber, error, retry);
          },
        );
      }

      run();
    });
}

const PENDING: LedgerSyncPendingJobState = { type: "pending" };
const PROCESSING: LedgerSyncProcessingJobState = { type: "processing" };
const COMPLETED: LedgerSyncCompletedJobState = { type: "completed" };

type LedgerSyncDeviceCall<Input, Result> = (params: {
  client: KeyRingClient;
  input: Input;
  callbacks: KeyRingDeviceCallbacks;
}) => Promise<Result>;

type JobSubscriber = Subscriber<LedgerSyncJobState>;

type LedgerSyncJobInput = Readonly<{
  client: KeyRingClient;
  resultOrder: LedgerSyncResultOrder;
}>;
