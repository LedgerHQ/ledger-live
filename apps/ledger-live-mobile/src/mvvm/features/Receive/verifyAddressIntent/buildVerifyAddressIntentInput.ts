import type { ReceiveVerification } from "@domain/entity-account-receive";
import { canVerifyOnDevice } from "@features/flow-receive";
import {
  getAddressVerification,
  notifyOnDeviceRequest,
  type VerifyAddressIntentInput,
} from "@features/platform-intent-verify-address";
import { toReceiveVerifyAddressOptions } from "@ledgerhq/live-common/account/receiveVerifyAddress";
import { DeviceAppVerifyNotSupported } from "@ledgerhq/live-common/errors";
import getAddress from "@ledgerhq/live-common/hw/getAddress/index";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import type { Account } from "@ledgerhq/types-live";

/** No input when the device cannot show the address for the user to compare. */
export function buildVerifyAddressIntentInput(
  account: Account,
  verification: ReceiveVerification | undefined,
): VerifyAddressIntentInput | undefined {
  if (!canVerifyOnDevice(verification)) return undefined;

  return {
    expectedAddress: verification.address,
    startAddressVerification: ({ dmk, sessionId }) =>
      getAddressVerification(async onDeviceRequest => {
        const options = await toReceiveVerifyAddressOptions(account, verification);
        if (!options) throw new DeviceAppVerifyNotSupported();
        const transport = new DmkCompatTransport(
          notifyOnDeviceRequest(dmk, onDeviceRequest),
          sessionId,
        );
        return getAddress(transport, options);
      }),
  };
}
