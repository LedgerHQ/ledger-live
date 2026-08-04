import { UserRefusedAddress, UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { TransportStatusError } from "@ledgerhq/hw-transport/errors";
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

  return new Observable<SignMessageIntentJobState>(subscriber => {
    let mainAccount;
    try {
      mainAccount = getMainAccount(input.account, input.parentAccount ?? undefined);
    } catch (error) {
      subscriber.error(normalizeSignError(error));
      return;
    }

    let innerSubscription: Subscription | undefined;
    let runRequestId = 0;

    const run = () => {
      const currentRunRequestId = ++runRequestId;
      innerSubscription?.unsubscribe();
      // The device-intent executor already connected the device and opened the right app,
      // so signing the (already prepared) message just needs the connected device id.
      subscriber.next({ type: "pending", deviceModelId: device.modelId });

      let hasSigned = false;

      innerSubscription = signMessageExec({
        request: { account: mainAccount, message: input.message },
        deviceId: device.deviceId,
      }).subscribe({
        next: result => {
          if (subscriber.closed || currentRunRequestId !== runRequestId) {
            return;
          }
          if (result?.signature) {
            hasSigned = true;
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
          // Defensive guard: signMessageExec always yields a signature before completing,
          // but if it ever completed without one, no terminal state would reach the drawer
          // and the wallet-api promise would never settle. Surface an error instead.
          if (!hasSigned) {
            subscriber.error(new Error("Signing completed without a signature"));
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
