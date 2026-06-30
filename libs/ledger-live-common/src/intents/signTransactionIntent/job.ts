import { TransportStatusError, UserRefusedOnDevice } from "@ledgerhq/errors";
import type { DeviceConnectionResult, Job } from "@ledgerhq/device-intent";
import { getMainAccount } from "../../account/index";
import { getAccountBridge } from "../../bridge/index";
import { TransactionRefusedOnDevice } from "../../errors";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { SignOperationEvent } from "@ledgerhq/types-live";
import { Observable, type Subscription } from "rxjs";
import type { SignTransactionIntentInput, SignTransactionIntentJobState } from "./types";

type SigningDevice = Readonly<{
  deviceId: string;
  modelId: DeviceModelId;
}>;

function buildSigningDevice(connectionResult: DeviceConnectionResult): SigningDevice {
  return {
    deviceId: connectionResult.compatDeviceId,
    modelId: connectionResult.compatDeviceModelId,
  };
}

function isUserRefusalError(error: unknown): boolean {
  return (
    error instanceof TransactionRefusedOnDevice ||
    error instanceof UserRefusedOnDevice ||
    (error instanceof TransportStatusError && error.statusCode === 0x6985)
  );
}

function normalizeSignError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function mapSignOperationEvent(
  event: SignOperationEvent,
  deviceModelId: DeviceModelId,
): SignTransactionIntentJobState | null {
  switch (event.type) {
    case "signed":
      return { type: "signed", signedOperation: event.signedOperation };
    case "device-signature-requested":
      return { type: "device-signature-requested", deviceModelId };
    case "device-streaming":
      return { type: "device-streaming", progress: event.progress };
    case "device-signature-granted":
      return { type: "device-signature-granted", deviceModelId };
    default:
      return null;
  }
}

export const signTransactionIntentJob: Job<
  SignTransactionIntentJobState,
  SignTransactionIntentInput
> = ({ deviceConnectionResult, input }) => {
  const device = buildSigningDevice(deviceConnectionResult);
  const mainAccount = getMainAccount(input.account, input.parentAccount ?? undefined);

  return new Observable<SignTransactionIntentJobState>(subscriber => {
    let innerSubscription: Subscription | undefined;
    let runRequestId = 0;

    const run = () => {
      const currentRunRequestId = ++runRequestId;
      innerSubscription?.unsubscribe();
      subscriber.next({ type: "pending", deviceModelId: device.modelId });

      getAccountBridge(mainAccount)
        .then(bridge => {
          if (subscriber.closed || currentRunRequestId !== runRequestId) {
            return;
          }

          innerSubscription = bridge
            .signOperation({
              account: mainAccount,
              transaction: input.transaction,
              deviceId: device.deviceId,
              deviceModelId: device.modelId,
            })
            .subscribe({
              next: event => {
                const state = mapSignOperationEvent(event, device.modelId);
                if (state) {
                  subscriber.next(state);
                }
              },
              // A user refusal is a terminal but non-error outcome: surface a dedicated
              // "cancelled" state (info screen + retry) instead of letting the error escape
              // the observable, which would otherwise trigger the executor's generic error screen.
              error: error => {
                if (isUserRefusalError(error)) {
                  subscriber.next({ type: "cancelled", retry: run });
                  return;
                }
                subscriber.error(normalizeSignError(error));
              },
              complete: () => {
                subscriber.complete();
              },
            });
        })
        .catch(error => {
          if (subscriber.closed || currentRunRequestId !== runRequestId) {
            return;
          }

          subscriber.error(normalizeSignError(error));
        });
    };

    run();

    return () => {
      runRequestId += 1;
      innerSubscription?.unsubscribe();
    };
  });
};
