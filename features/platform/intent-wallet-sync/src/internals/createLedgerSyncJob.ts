import {
  isDeviceDisconnectedError,
  type DeviceConnectionResult,
  type Job,
} from "@features/platform-device-intent";
import type {
  TrustchainDeviceCallbacks,
  TrustchainSDK,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import { Observable, type Subscriber } from "rxjs";
import type { CreateSessionSdk } from "../session";
import { isUserRefusedOnDevice, mapLedgerSyncErrorToFailure } from "../failure";
import type {
  LedgerSyncAwaitingDeviceConfirmationJobState,
  LedgerSyncCompletedJobState,
  LedgerSyncDeviceRejectedJobState,
  LedgerSyncJobState,
  LedgerSyncPendingJobState,
  LedgerSyncProcessingJobState,
} from "../jobState";
import { toError } from "./errors";

type LedgerSyncDeviceCall<Input, Result> = (params: {
  sdk: TrustchainSDK;
  deviceId: string;
  input: Input;
  callbacks: TrustchainDeviceCallbacks;
}) => Promise<Result>;

type JobSubscriber = Subscriber<LedgerSyncJobState>;

const PENDING: LedgerSyncPendingJobState = { type: "pending" };
const PROCESSING: LedgerSyncProcessingJobState = { type: "processing" };
const COMPLETED: LedgerSyncCompletedJobState = { type: "completed" };

export function failJob(subscriber: JobSubscriber, error: unknown): void {
  subscriber.next(mapLedgerSyncErrorToFailure(error));
  subscriber.complete();
}

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

// The device part is done, so the app must still store the result once nobody watches the job.
export function deliverLateResult<Result>(
  onResult: (result: Result) => void,
  result: Result,
): void {
  try {
    onResult(result);
  } catch {
    // The subscriber is closed: there is nobody left to report the throw to.
  }
}

export function tryCreateSessionSdk(
  createSessionSdk: CreateSessionSdk,
  connection: DeviceConnectionResult,
  subscriber: JobSubscriber,
): TrustchainSDK | undefined {
  try {
    return createSessionSdk(connection);
  } catch (error) {
    failJob(subscriber, error);
    return undefined;
  }
}

export function createDeviceCallbacks(
  subscriber: JobSubscriber,
  { connectedDevice, compatDeviceName }: DeviceConnectionResult,
  isCurrentRun: () => boolean,
): TrustchainDeviceCallbacks {
  return {
    onStartRequestUserInteraction: () => {
      if (!isCurrentRun()) return;
      const awaiting: LedgerSyncAwaitingDeviceConfirmationJobState = {
        type: "awaiting-device-confirmation",
        deviceModelId: connectedDevice.modelId,
        deviceName: compatDeviceName,
      };
      subscriber.next(awaiting);
    },
    onEndRequestUserInteraction: () => {
      if (isCurrentRun()) subscriber.next(PROCESSING);
    },
  };
}

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

// Builds the SDK once per run, so a retry after a refusal reuses it and its JWT.
export function createLedgerSyncJob<Input extends { createSessionSdk: CreateSessionSdk }, Result>(
  call: LedgerSyncDeviceCall<Input, Result>,
): Job<LedgerSyncJobState, Input, Result> {
  return ({ deviceConnectionResult, input, onResult }) =>
    new Observable<LedgerSyncJobState>(subscriber => {
      const sdk = tryCreateSessionSdk(input.createSessionSdk, deviceConnectionResult, subscriber);
      if (!sdk) return;

      let runToken = 0;

      const run = () => {
        const token = ++runToken;
        const isLatestRun = () => token === runToken;
        const isCurrentRun = () => !subscriber.closed && isLatestRun();
        const retry = () => {
          if (isCurrentRun()) run();
        };
        const callbacks = createDeviceCallbacks(subscriber, deviceConnectionResult, isCurrentRun);

        subscriber.next(PENDING);
        (async () =>
          call({ sdk, deviceId: deviceConnectionResult.compatDeviceId, input, callbacks }))().then(
          result => {
            if (!isLatestRun()) return;
            if (subscriber.closed) deliverLateResult(onResult, result);
            else completeJob(subscriber, onResult, result);
          },
          (error: unknown) => {
            if (isCurrentRun()) handleCallError(subscriber, error, retry);
          },
        );
      };

      run();
    });
}
