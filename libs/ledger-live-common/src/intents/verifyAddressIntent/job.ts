import {
  UserRefusedOnDevice,
  WrongDeviceForAccount,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { DeviceAppVerifyNotSupported, UserRefusedAddress } from "../../errors";
import { TransportStatusError } from "@ledgerhq/hw-transport/errors";
import type { DeviceConnectionResult, Job } from "@ledgerhq/device-intent";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import { Observable } from "rxjs";
import { getMainAccount } from "../../account/index";
import getAddress from "../../hw/getAddress/index";
import type { VerifyAddressIntentInput, VerifyAddressIntentJobState } from "./types";

type VerifyingDevice = Readonly<{
  modelId: DeviceModelId;
}>;

function buildVerifyingDevice(connectionResult: DeviceConnectionResult): VerifyingDevice {
  return {
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

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export const verifyAddressIntentJob: Job<VerifyAddressIntentJobState, VerifyAddressIntentInput> = ({
  deviceConnectionResult,
  input,
}) => {
  const device = buildVerifyingDevice(deviceConnectionResult);
  const { dmk, sessionId } = deviceConnectionResult;

  return new Observable<VerifyAddressIntentJobState>(subscriber => {
    let mainAccount;
    try {
      mainAccount = getMainAccount(input.account, input.parentAccount ?? undefined);
    } catch (error) {
      subscriber.error(normalizeError(error));
      return;
    }

    const expectedAddress = mainAccount.freshAddress;
    const path = input.path || mainAccount.freshAddressPath;
    let runRequestId = 0;

    const run = () => {
      const currentRunRequestId = ++runRequestId;
      // The device-intent executor already connected the device and opened the right app,
      // so we only need to bridge the live DMK session to a legacy transport and ask the
      // app to display + confirm the address on-device (verify: true).
      subscriber.next({
        type: "pending",
        deviceModelId: device.modelId,
        address: expectedAddress,
      });

      const transport = new DmkCompatTransport(dmk, sessionId);

      getAddress(transport, {
        currency: mainAccount.currency,
        derivationMode: mainAccount.derivationMode,
        path,
        verify: true,
      })
        .then(result => {
          if (subscriber.closed || currentRunRequestId !== runRequestId) {
            return;
          }
          // Guard against a device holding another seed than the one that owns the account.
          if (result.address !== expectedAddress) {
            subscriber.error(new WrongDeviceForAccount());
            return;
          }
          subscriber.next({ type: "verified", address: result.address });
          subscriber.complete();
        })
        // A user refusal is a terminal but non-error outcome: surface a dedicated
        // "cancelled" state (info screen + retry) instead of letting the error escape
        // the observable, which would otherwise trigger the executor's generic error screen.
        .catch(error => {
          if (subscriber.closed || currentRunRequestId !== runRequestId) {
            return;
          }
          if (isUserRefusalError(error)) {
            subscriber.next({ type: "cancelled", retry: run });
            return;
          }
          // Some apps cannot display the address on the device: this is not a failure,
          // the address was still derived, we just could not confirm it visually.
          if (error instanceof DeviceAppVerifyNotSupported) {
            subscriber.next({ type: "unsupported", error });
            subscriber.complete();
            return;
          }
          subscriber.error(normalizeError(error));
        });
    };

    run();

    return () => {
      runRequestId += 1;
    };
  });
};
