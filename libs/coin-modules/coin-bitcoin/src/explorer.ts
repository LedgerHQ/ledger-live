import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { Account as WalletAccount } from "@ledgerhq/wallet-btc/account";
import BitcoinLikeExplorer from "@ledgerhq/wallet-btc/explorer/index";
import { blockchainBaseURL as walletBtcBaseURL } from "@ledgerhq/wallet-btc/explorer/baseUrl";
import type { BitcoinCoinConfig, BitcoinContext } from "./config";
import type { BitcoinAccount } from "./types";
import { toWalletBtcCurrency, type ExplorerConfig } from "./walletBtcCurrency";

/**
 * CryptoCurrency-friendly adapter over wallet-btc's blockchainBaseURL.
 *
 * Kept here so existing consumers (e.g. ledger-live-common) can keep importing
 * `@ledgerhq/coin-bitcoin/explorer` with a CryptoCurrency, while wallet-btc stays
 * dependency-inverted (it only knows the injected WalletBtcCurrency).
 */
export const blockchainBaseURL = (currency: CryptoCurrency, config: ExplorerConfig): string =>
  walletBtcBaseURL(toWalletBtcCurrency(currency, config));

/**
 * Points a wallet-btc account at the explorer the coin config names.
 *
 * A deserialized account carries no explorer endpoint (deserialization is synchronous and the coin
 * config is not), so every path that reaches the explorer binds it here first, from the config it
 * just resolved. A remote change of `explorer.url`, `explorer.batchSize` or `explorerId` therefore
 * applies on the next call.
 */
export function bindExplorer(
  walletAccount: WalletAccount,
  currency: CryptoCurrency,
  config: ExplorerConfig,
): WalletAccount {
  const explorer = new BitcoinLikeExplorer({
    cryptoCurrency: toWalletBtcCurrency(currency, config),
  });
  const current = walletAccount.xpub.explorer;
  if (
    !(current instanceof BitcoinLikeExplorer) ||
    current.baseUrl !== explorer.baseUrl ||
    current.batchSize !== explorer.batchSize
  ) {
    walletAccount.xpub.explorer = explorer;
  }
  return walletAccount;
}

/**
 * Resolves the coin config of `account` and binds its wallet-btc account (when it has one) to the
 * explorer that config names, so the code reached from a bridge method finds a usable explorer.
 */
export async function resolveAccountConfig(
  context: BitcoinContext,
  account: Account,
): Promise<BitcoinCoinConfig> {
  const config = await context.config(account.currency.id);
  const walletAccount = (account as BitcoinAccount).bitcoinResources?.walletAccount;
  if (walletAccount) bindExplorer(walletAccount, account.currency, config);
  return config;
}
