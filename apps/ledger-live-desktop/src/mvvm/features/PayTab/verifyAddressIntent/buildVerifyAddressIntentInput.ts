import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { VerifyAddressIntentInput } from "@features/platform-verify-address-intent";
import { getAddressVerification } from "./adapters/getAddressVerification";

/**
 * Build the {@link VerifyAddressIntentInput} for the Pay request flow.
 *
 * This is the app-side dependency-injection seam: the shared intent package
 * stays free of any signer. The host verifies through the generic `getAddress`
 * resolver run over the DIE's DMK transport, which already routes to the right
 * per-family signer (DMK-native where wired and flag-enabled, legacy otherwise)
 * — so no per-family branching is needed here. See {@link getAddressVerification}.
 */
export function buildVerifyAddressIntentInput(
  account: AccountLike,
  parentAccount?: Account | null,
): VerifyAddressIntentInput {
  const mainAccount = getMainAccount(account, parentAccount ?? undefined);
  const { freshAddress, freshAddressPath, currency, derivationMode } = mainAccount;

  return {
    expectedAddress: freshAddress,
    startAddressVerification: connection =>
      getAddressVerification(connection, {
        currency,
        path: freshAddressPath,
        derivationMode,
      }),
  };
}
