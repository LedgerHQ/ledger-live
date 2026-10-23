import type { Account, AccountLike } from "@ledgerhq/types-live";

const HYPERCORE_CURRENCY_ID = "hypercore";

export type PerpsMigrationParams = {
  /** The legacy (Arbitrum) Perps account that started the migration, carried as context. */
  legacyAccountId: string;
};

export type PerpsMigrationUiParams = {
  legacyAccount: Account;
  /** Hyperliquid accounts already in the wallet; the user can pick one instead of adding one. */
  existingAccounts: Account[];
};

export type PerpsMigratedAccount = {
  /** Wallet API account id of a Hyperliquid account the user selected. */
  accountId: string;
  /** False when the account was already in the wallet before the flow. */
  created: boolean;
};

export type PerpsMigrationResult = {
  accounts: PerpsMigratedAccount[];
};

export function getHypercoreAccounts(accounts: AccountLike[]): Account[] {
  return accounts.filter(
    (account): account is Account =>
      account.type === "Account" && account.currency.id === HYPERCORE_CURRENCY_ID,
  );
}
