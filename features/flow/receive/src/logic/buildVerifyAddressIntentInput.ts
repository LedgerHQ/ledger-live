import type { ReceiveVerification } from "@domain/entity-account-receive";
import {
  getAddressVerification,
  notifyOnDeviceRequest,
  type VerifyAddressIntentInput,
} from "@features/platform-intent-verify-address";
import type { VerifyOnDevicePorts } from "../types";
import { canVerifyOnDevice } from "./canVerifyOnDevice";

const CANCELLED_BEFORE_DEVICE_REQUEST = "Address verification cancelled before the device request";

export type VerifyAddressDeviceListeners = Readonly<{
  /** Each time the job asks the device: on its first run and on every retry. */
  onAttemptStart?: () => void;
  /** The request reached the device, which shows the address. */
  onAddressDisplayed?: () => void;
}>;

/**
 * Cancelling stops the signer only until its first request reaches the device. From then on it
 * finishes its sequence, so the device still shows the address when the user went back early, as
 * when Bitcoin's signer is still on its silent requests.
 */
function stopBeforeDeviceRequest(signal: AbortSignal) {
  const controller = new AbortController();
  let hasRequested = false;
  const stop = () => {
    if (!hasRequested) controller.abort();
  };
  if (signal.aborted) stop();
  else signal.addEventListener("abort", stop, { once: true });

  return {
    signal: controller.signal,
    onRequest: () => {
      hasRequested = true;
    },
  };
}

/** No input when the device cannot show the address for the user to compare. */
export function buildVerifyAddressIntentInput<Account, Options>(
  account: Account,
  verification: ReceiveVerification | undefined,
  ports: VerifyOnDevicePorts<Account, Options>,
  { onAttemptStart, onAddressDisplayed }: VerifyAddressDeviceListeners = {},
): VerifyAddressIntentInput | undefined {
  if (!canVerifyOnDevice(verification)) return undefined;

  return {
    expectedAddress: verification.address,
    startAddressVerification: ({ dmk, sessionId }) => {
      onAttemptStart?.();
      return getAddressVerification(async (onDeviceRequest, signal) => {
        const options = await ports.getAddressOptions(account, verification);
        if (signal.aborted) throw new Error(CANCELLED_BEFORE_DEVICE_REQUEST);

        const untilRequest = stopBeforeDeviceRequest(signal);
        const onRequest = () => {
          untilRequest.onRequest();
          onDeviceRequest();
          onAddressDisplayed?.();
        };
        const device = {
          dmk: notifyOnDeviceRequest(dmk, onRequest, untilRequest.signal),
          sessionId,
        };
        return ports.getAddress(device, options);
      });
    },
  };
}
