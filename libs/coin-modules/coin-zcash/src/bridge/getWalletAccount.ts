import type { Account } from "@ledgerhq/types-live";
import type { Account as WalletAccount } from "@ledgerhq/wallet-btc/account";
import { AccountNeedResync } from "@ledgerhq/wallet-btc/errors";
import type { BitcoinAccount } from "../types/bridge";

/**
 * Resolve the wallet-btc Account carried by a Ledger Live Zcash account.
 *
 * Option D self-contained copy: coin-bitcoin's version of this helper reaches
 * `account.bitcoinResources.walletAccount` and knows about the legacy
 * `libcore` migration; this is Ledger Live integration glue local to this
 * package, not imported from @ledgerhq/coin-bitcoin.
 */
export const getWalletAccount = (account: Account): WalletAccount => {
  const walletAccount = (account as BitcoinAccount).bitcoinResources?.walletAccount;
  if (account.id.startsWith("libcore") || !walletAccount) {
    throw new AccountNeedResync();
  }
  return walletAccount;
};
