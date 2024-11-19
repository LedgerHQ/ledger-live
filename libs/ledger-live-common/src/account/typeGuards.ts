import { BitcoinAccount } from "@ledgerhq/coin-bitcoin/lib/types";
import { Account, AccountLike } from "@ledgerhq/types-live";

export function isBitcoinBasedAccount(account: Account | AccountLike): account is BitcoinAccount {
  return (account as BitcoinAccount).bitcoinResources !== undefined;
}

export function isBitcoinAccount(account: Account): boolean {
  return account.currency.id === "bitcoin";
}
