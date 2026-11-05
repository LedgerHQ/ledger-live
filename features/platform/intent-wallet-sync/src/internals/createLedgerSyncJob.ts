import type { Job } from "@features/platform-device-intent";
import type {
  TrustchainDeviceCallbacks,
  TrustchainSDK,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import { Observable } from "rxjs";
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

const PENDING: LedgerSyncJobState = { type: "pending" };
const COMPLETED: LedgerSyncJobState = { type: "completed" };

/**
 * Runs one Ledger Sync SDK call on the DIE session and maps its lifecycle to
 * {@link LedgerSyncJobState}.
 *
 * The SDK is built once per run, so a retry after a refusal reuses it and the
 * JWT it may already hold. Errors are emitted as job states, never as
 * observable errors: a disconnection reaches DIE through its own session
 * monitoring.
 */
export function createLedgerSyncJob<Input extends { createSessionSdk: CreateSessionSdk }, Result>(
  call: LedgerSyncDeviceCall<Input, Result>,
): Job<LedgerSyncJobState, Input, Result> {
  return ({ deviceConnectionResult, input, onResult }) =>
    new Observable<LedgerSyncJobState>(subscriber => {
      const { compatDeviceId, compatDeviceName, connectedDevice } = deviceConnectionResult;
      let runToken = 0;

      const fail = (error: unknown) => {
        subscriber.next(mapLedgerSyncErrorToFailure(error));
        subscriber.complete();
      };

      let sdk: TrustchainSDK;
      try {
        sdk = input.createSessionSdk(deviceConnectionResult);
      } catch (error) {
        fail(error);
        return;
      }

      const run = () => {
        const token = ++runToken;
        const isCurrentRun = () => !subscriber.closed && token === runToken;

        subscriber.next(PENDING);

        const callbacks: TrustchainDeviceCallbacks = {
          onStartRequestUserInteraction: () => {
            if (!isCurrentRun()) return;
            subscriber.next({
              type: "awaiting-device-confirmation",
              deviceModelId: connectedDevice.modelId,
              deviceName: compatDeviceName,
            });
          },
          onEndRequestUserInteraction: () => {
            if (isCurrentRun()) subscriber.next(PENDING);
          },
        };

        (async () => call({ sdk, deviceId: compatDeviceId, input, callbacks }))().then(
          result => {
            if (!isCurrentRun()) return;
            onResult(result);
            subscriber.next(COMPLETED);
            subscriber.complete();
          },
          (error: unknown) => {
            if (!isCurrentRun()) return;
            if (isUserRefusedOnDevice(error)) {
              subscriber.next({ type: "device-rejected", error: toError(error), retry: run });
              return;
            }
            fail(error);
          },
        );
      };

      run();

      return () => {
        runToken += 1;
      };
    });
}
