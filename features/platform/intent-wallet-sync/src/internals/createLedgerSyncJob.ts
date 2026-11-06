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
import type { CreateSessionSdk } from "../createSessionSdk";
import { isUserRefusedOnDevice, mapLedgerSyncErrorToFailure } from "../ledgerSyncFailure";
import type { LedgerSyncJobState } from "../ledgerSyncJobState";
import { toError } from "./errors";

type LedgerSyncDeviceCall<Input, Result> = (params: {
  sdk: TrustchainSDK;
  deviceId: string;
  input: Input;
  callbacks: TrustchainDeviceCallbacks;
}) => Promise<Result>;

type JobSubscriber = Subscriber<LedgerSyncJobState>;

const PENDING: LedgerSyncJobState = { type: "pending" };
const PROCESSING: LedgerSyncJobState = { type: "processing" };
const COMPLETED: LedgerSyncJobState = { type: "completed" };

function failJob(subscriber: JobSubscriber, error: unknown): void {
  subscriber.next(mapLedgerSyncErrorToFailure(error));
  subscriber.complete();
}

function completeJob<Result>(
  subscriber: JobSubscriber,
  onResult: (result: Result) => void,
  result: Result,
): void {
  onResult(result);
  subscriber.next(COMPLETED);
  subscriber.complete();
}

function tryCreateSessionSdk(
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

function createDeviceCallbacks(
  subscriber: JobSubscriber,
  { connectedDevice, compatDeviceName }: DeviceConnectionResult,
  isCurrentRun: () => boolean,
): TrustchainDeviceCallbacks {
  return {
    onStartRequestUserInteraction: () => {
      if (!isCurrentRun()) return;
      subscriber.next({
        type: "awaiting-device-confirmation",
        deviceModelId: connectedDevice.modelId,
        deviceName: compatDeviceName,
      });
    },
    onEndRequestUserInteraction: () => {
      if (isCurrentRun()) subscriber.next(PROCESSING);
    },
  };
}

function handleCallError(subscriber: JobSubscriber, error: unknown, retry: () => void): void {
  if (isDeviceDisconnectedError(error)) {
    subscriber.error(error);
    return;
  }
  if (isUserRefusedOnDevice(error)) {
    subscriber.next({ type: "device-rejected", error: toError(error), retry });
    return;
  }
  failJob(subscriber, error);
}

/**
 * Runs one Ledger Sync SDK call on the DIE session and maps its lifecycle to
 * {@link LedgerSyncJobState}.
 *
 * The SDK is built once per run, so a retry after a refusal reuses it and the
 * JWT it may already hold. Errors are emitted as job states, except a device
 * disconnection, which errors the observable so DIE shows its Disconnected
 * screen.
 */
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
        const isCurrentRun = () => !subscriber.closed && token === runToken;
        const retry = () => {
          if (isCurrentRun()) run();
        };
        const callbacks = createDeviceCallbacks(subscriber, deviceConnectionResult, isCurrentRun);

        subscriber.next(PENDING);
        (async () =>
          call({ sdk, deviceId: deviceConnectionResult.compatDeviceId, input, callbacks }))().then(
          result => {
            if (isCurrentRun()) completeJob(subscriber, onResult, result);
          },
          (error: unknown) => {
            if (isCurrentRun()) handleCallError(subscriber, error, retry);
          },
        );
      };

      run();

      return () => {
        runToken += 1;
      };
    });
}
