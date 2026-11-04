import type { Account, AccountLike } from "@ledgerhq/types-live";
import { HYPERCORE_CURRENCY_ID } from "./constants";

export type PerpsMigrationParams = {
  /** The legacy (Arbitrum) Perps account to migrate. */
  legacyAccountId: string;
};

export type PerpsMigratedAccount = {
  /** Wallet API account id of the Hyperliquid account at the legacy account's address. */
  accountId: string;
  /** False when the account was already in the wallet before the flow. */
  created: boolean;
};

export type PerpsMigrationResult = {
  accounts: PerpsMigratedAccount[];
};

function getHypercoreAccounts(accounts: AccountLike[]): Account[] {
  return accounts.filter(
    (account): account is Account =>
      account.type === "Account" && account.currency.id === HYPERCORE_CURRENCY_ID,
  );
}

/**
 * The Hyperliquid account holding the legacy account's positions: the one at the same EVM address.
 * Addresses are compared case-insensitively, as EVM addresses may or may not be checksummed.
 */
export function findMigrationAccount(
  accounts: AccountLike[],
  legacyAccount: Account,
): Account | undefined {
  const legacyAddress = legacyAccount.freshAddress.toLowerCase();
  return getHypercoreAccounts(accounts).find(
    account => account.freshAddress.toLowerCase() === legacyAddress,
  );
}
