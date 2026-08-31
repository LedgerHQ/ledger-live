import getAddress from "@ledgerhq/live-common/hw/getAddress/index";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import type { Account } from "@ledgerhq/types-live";
import {
  getAddressVerification,
  type VerifyAddressIntentInput,
} from "@features/platform-verify-address-intent";

function getExpectedVerifyAddress(account: Account): string {
  return account.derivationMode === "canton" ? (account.xpub ?? "") : account.freshAddress;
}

export function buildVerifyAddressIntentInput(mainAccount: Account): VerifyAddressIntentInput {
  const { freshAddressPath, currency, derivationMode } = mainAccount;

  return {
    expectedAddress: getExpectedVerifyAddress(mainAccount),
    startAddressVerification: ({ dmk, sessionId }) =>
      getAddressVerification(() =>
        getAddress(new DmkCompatTransport(dmk, sessionId), {
          currency,
          path: freshAddressPath,
          derivationMode,
          verify: true,
        }),
      ),
  };
}
