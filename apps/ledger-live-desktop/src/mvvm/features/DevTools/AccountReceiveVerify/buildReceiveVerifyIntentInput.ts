import getAddress from "@ledgerhq/live-common/hw/getAddress/index";
import { toReceiveVerifyAddressOptions } from "@ledgerhq/live-common/account/receiveVerifyAddress";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import type { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import {
  getAddressVerification,
  type VerifyAddressIntentInput,
} from "@features/platform-intent-verify-address";
import type { AccountReceiveVerifyRequest } from "@devtools/bindings";

/** The device call of a request, or why the verify-address intent cannot run it. */
export type ReceiveVerifyPlan =
  | {
      readonly type: "ready";
      readonly options: GetAddressOptions;
      readonly input: VerifyAddressIntentInput;
    }
  | { readonly type: "unsupported"; readonly reason: string };

export async function planReceiveVerify({
  descriptor,
  verification,
  target,
}: AccountReceiveVerifyRequest): Promise<ReceiveVerifyPlan> {
  const options = await toReceiveVerifyAddressOptions(descriptor, verification, target);
  if (!options || verification.type !== "address") {
    return {
      type: "unsupported",
      reason:
        target === "shielded"
          ? "the shielded address needs getShieldedAddress"
          : `the intent compares a getAddress address, not a ${verification.type} verification`,
    };
  }
  return {
    type: "ready",
    options,
    input: {
      expectedAddress: verification.address,
      startAddressVerification: ({ dmk, sessionId }) =>
        getAddressVerification(() => getAddress(new DmkCompatTransport(dmk, sessionId), options)),
    },
  };
}
