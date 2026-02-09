import type { Account as WalletAccount } from "./account";
import type { Account as LiveAccount } from "@ledgerhq/types-live";
import { AccountNeedResync } from "../errors";
import type { BitcoinAccount } from "../types";

/**
 * Resolve the wallet-btc Account from a Live account.
 * Placed in a separate file to avoid circular dependency with wallet.ts (which uses rbfHelpers).
 */
export const getWalletAccount = (account: LiveAccount): WalletAccount => {
  const walletAccount = (account as BitcoinAccount).bitcoinResources?.walletAccount;
  if (account.id.startsWith("libcore") || !walletAccount) {
    throw new AccountNeedResync();
  }
  return walletAccount;
};
