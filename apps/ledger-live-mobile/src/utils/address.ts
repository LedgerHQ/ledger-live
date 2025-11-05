import { Account } from "@ledgerhq/types-live";

export function getFreshAccountAddress(account: Account): string {
  if (account.derivationMode === "canton") {
    return account.xpub ?? "";
  }
  return account.freshAddress;
}
