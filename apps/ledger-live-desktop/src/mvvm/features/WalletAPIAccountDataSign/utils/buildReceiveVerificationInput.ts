import { of } from "rxjs";
import { decodeAccountId } from "@ledgerhq/live-common/account/index";
import getAddress from "@ledgerhq/live-common/hw/getAddress/index";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import type { AccountEntry } from "@domain/entity-account";
import { currencyIdFromNetwork } from "@domain/entity-account-descriptor";
import type { ReceiveVerification } from "@domain/entity-account-receive";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  getAddressVerification,
  type StartAddressVerification,
  type VerifyAddressIntentInput,
} from "@features/platform-verify-address-intent";

/** The descriptor has no derivation mode: the legacy id carries it, the default mode otherwise. */
const derivationModeOf = (entry: AccountEntry) =>
  entry.legacyId ? decodeAccountId(entry.legacyId).derivationMode : "";

const cannotVerify: StartAddressVerification = () => ({
  observable: of({
    type: "unsupported",
    error: new Error("The device cannot be given an address to confirm"),
  }),
  cancel: () => {},
});

/** How the device confirms the receive address, through the coin module `getAddress`. */
export function buildReceiveVerificationInput(
  entry: AccountEntry,
  verification: ReceiveVerification,
): VerifyAddressIntentInput {
  if (verification.type === "addressConfirmation") {
    return { expectedAddress: verification.address, startAddressVerification: cannotVerify };
  }

  const currency = getCryptoCurrencyById(currencyIdFromNetwork(entry.descriptor.network));
  const derivationMode = derivationModeOf(entry);
  const showsPublicKey = verification.type === "publicKey";

  return {
    expectedAddress: showsPublicKey ? verification.publicKey : verification.address,
    startAddressVerification: ({ dmk, sessionId }) =>
      getAddressVerification(async () => {
        const result = await getAddress(new DmkCompatTransport(dmk, sessionId), {
          currency,
          path: verification.path,
          derivationMode,
          verify: true,
        });
        return { address: showsPublicKey ? result.publicKey : result.address };
      }),
  };
}
