import type { ReceiveVerification } from "@domain/entity-account-receive";
import {
  getAddressVerification,
  notifyOnDeviceRequest,
  type VerifyAddressIntentInput,
} from "@features/platform-intent-verify-address";
import type { VerifyOnDevicePorts } from "../types";
import { canVerifyOnDevice } from "./canVerifyOnDevice";

const CANCELLED_BEFORE_DEVICE_REQUEST = "Address verification cancelled before the device request";

/**
 * No input when the device cannot show the address for the user to compare. `onAttemptStart` runs
 * each time the job asks the device: on its first run and on every retry.
 */
export function buildVerifyAddressIntentInput<Account, Options>(
  account: Account,
  verification: ReceiveVerification | undefined,
  ports: VerifyOnDevicePorts<Account, Options>,
  onAttemptStart?: () => void,
): VerifyAddressIntentInput | undefined {
  if (!canVerifyOnDevice(verification)) return undefined;

  return {
    expectedAddress: verification.address,
    startAddressVerification: ({ dmk, sessionId }) => {
      onAttemptStart?.();
      return getAddressVerification(async (onDeviceRequest, signal) => {
        const options = await ports.getAddressOptions(account, verification);
        if (signal.aborted) throw new Error(CANCELLED_BEFORE_DEVICE_REQUEST);

        const device = { dmk: notifyOnDeviceRequest(dmk, onDeviceRequest, signal), sessionId };
        return ports.getAddress(device, options);
      });
    },
  };
}
