import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { Account as WalletAccount } from "@ledgerhq/wallet-btc/account";
import BitcoinLikeExplorer from "@ledgerhq/wallet-btc/explorer/index";
import { toWalletBtcCurrency } from "../walletBtcCurrency";

/**
 * Points a wallet-btc account at the explorer the coin config names.
 *
 * A deserialized account carries no explorer endpoint (deserialization is synchronous and the coin
 * config is not), so every path that reaches the explorer binds it here first, from the config it
 * just resolved. A remote change of `explorer.url` therefore applies on the next sync or broadcast.
 */
export function bindExplorer(
  walletAccount: WalletAccount,
  currency: CryptoCurrency,
  explorerUrl: string,
): WalletAccount {
  const explorer = new BitcoinLikeExplorer({
    cryptoCurrency: toWalletBtcCurrency(currency, explorerUrl),
  });
  const current = walletAccount.xpub.explorer;
  if (!(current instanceof BitcoinLikeExplorer) || current.baseUrl !== explorer.baseUrl) {
    walletAccount.xpub.explorer = explorer;
  }
  return walletAccount;
}
