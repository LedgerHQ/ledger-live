import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import type { Account } from "@ledgerhq/types-live";
import type { ExpectedAccountIdentity } from "./types";

export function buildExpectedAccountIdentity(account: Account): ExpectedAccountIdentity {
  return {
    accountName: getDefaultAccountName(account),
    acceptableDerivedAddresses: [
      account.freshAddress,
      ...(account.seedIdentifier ? [account.seedIdentifier] : []),
    ],
  };
}

export function validateDerivedAddress(
  expectedAccount: ExpectedAccountIdentity | undefined,
  derivedAddress: string | undefined,
): { status: "match" } | { status: "skipped" } | { status: "mismatch"; accountName: string } {
  if (!expectedAccount || !derivedAddress) {
    return { status: "skipped" };
  }

  if (expectedAccount.acceptableDerivedAddresses.includes(derivedAddress)) {
    return { status: "match" };
  }

  return { status: "mismatch", accountName: expectedAccount.accountName };
}
