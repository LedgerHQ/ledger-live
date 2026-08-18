import type { Account } from "@ledgerhq/types-live";
import type { Account as WalletAccount } from "@ledgerhq/wallet-btc/account";
import { AccountNeedResync } from "./errors";
import type { BitcoinAccount } from "./types";

/**
 * Resolve the wallet-btc Account carried by a Ledger Live bitcoin account.
 *
 * This is Ledger Live integration glue — it knows about the LL account model
 * (`bitcoinResources`) and the legacy `libcore` migration — so it lives in
 * coin-bitcoin, not in the generic wallet-btc engine. Callers hold the generic
 * `Account` (bridge signatures), so we narrow to `BitcoinAccount` here.
 */
export const getWalletAccount = (account: Account): WalletAccount => {
  const walletAccount = (account as BitcoinAccount).bitcoinResources?.walletAccount;
  if (account.id.startsWith("libcore") || !walletAccount) {
    throw new AccountNeedResync();
  }
  return walletAccount;
};
