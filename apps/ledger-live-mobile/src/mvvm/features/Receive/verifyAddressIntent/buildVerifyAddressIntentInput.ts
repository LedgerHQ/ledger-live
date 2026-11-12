import getAddress from "@ledgerhq/live-common/hw/getAddress/index";
import { toReceiveVerifyAddressOptions } from "@ledgerhq/live-common/account/receiveVerifyAddress";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import {
  getAddressVerification,
  type VerifyAddressIntentInput,
} from "@features/platform-intent-verify-address";
import type { VerifyAddressSelection } from "./useVerifyAddressFlow";

/** The device shows the address of `verification`, compared to the one the screen shares. */
export function buildVerifyAddressIntentInput({
  account,
  verification,
}: Pick<VerifyAddressSelection, "account" | "verification">): VerifyAddressIntentInput {
  return {
    expectedAddress: verification.address,
    startAddressVerification: ({ dmk, sessionId }) =>
      getAddressVerification(async () => {
        const options = await toReceiveVerifyAddressOptions(account, verification);
        if (!options) throw new Error(`No getAddress call verifies ${verification.path}`);
        return getAddress(new DmkCompatTransport(dmk, sessionId), options);
      }),
  };
}
