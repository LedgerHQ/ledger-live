import { TransportStatusError, UserRefusedAddress, UserRefusedOnDevice } from "@ledgerhq/errors";
import type { DeviceConnectionResult, Job } from "@ledgerhq/device-intent";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { Observable, type Subscription } from "rxjs";
import { getMainAccount } from "../../account/index";
import { signMessageExec } from "../../hw/signMessage/index";
import type { SignMessageIntentInput, SignMessageIntentJobState } from "./types";

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
    error instanceof UserRefusedOnDevice ||
    error instanceof UserRefusedAddress ||
    (error instanceof TransportStatusError &&
      (error.statusCode === 0x6985 || error.statusCode === 0x5501))
  );
}

function normalizeSignError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export const signMessageIntentJob: Job<SignMessageIntentJobState, SignMessageIntentInput> = ({
  deviceConnectionResult,
  input,
}) => {
  const device = buildSigningDevice(deviceConnectionResult);
  const mainAccount = getMainAccount(input.account, input.parentAccount ?? undefined);

  return new Observable<SignMessageIntentJobState>(subscriber => {
    let innerSubscription: Subscription | undefined;
    let runRequestId = 0;

    const run = () => {
      const currentRunRequestId = ++runRequestId;
      innerSubscription?.unsubscribe();
      // The device-intent executor already connected the device and opened the right app,
      // so signing the (already prepared) message just needs the connected device id.
      subscriber.next({ type: "pending", deviceModelId: device.modelId });

      innerSubscription = signMessageExec({
        request: { account: mainAccount, message: input.message },
        deviceId: device.deviceId,
      }).subscribe({
        next: result => {
          if (subscriber.closed || currentRunRequestId !== runRequestId) {
            return;
          }
          if (result?.signature) {
            subscriber.next({ type: "signed", signature: result.signature });
          }
        },
        // A user refusal is a terminal but non-error outcome: surface a dedicated
        // "cancelled" state (info screen + retry) instead of letting the error escape
        // the observable, which would otherwise trigger the executor's generic error screen.
        error: error => {
          if (subscriber.closed || currentRunRequestId !== runRequestId) {
            return;
          }
          if (isUserRefusalError(error)) {
            subscriber.next({ type: "cancelled", retry: run });
            return;
          }
          subscriber.error(normalizeSignError(error));
        },
        complete: () => {
          if (subscriber.closed || currentRunRequestId !== runRequestId) {
            return;
          }
          subscriber.complete();
        },
      });
    };

    run();

    return () => {
      runRequestId += 1;
      innerSubscription?.unsubscribe();
    };
  });
};
