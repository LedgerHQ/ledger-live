import type { Account } from "@ledgerhq/types-live";
import type { VerifyAddressIntentInput } from "@features/platform-verify-address-intent";
import { getFreshAccountAddress } from "~/utils/address";
import { getAddressVerification } from "./adapters/getAddressVerification";

export function buildVerifyAddressIntentInput(mainAccount: Account): VerifyAddressIntentInput {
  const { freshAddressPath, currency, derivationMode } = mainAccount;

  return {
    expectedAddress: getFreshAccountAddress(mainAccount),
    startAddressVerification: connection =>
      getAddressVerification(connection, {
        currency,
        path: freshAddressPath,
        derivationMode,
      }),
  };
}
