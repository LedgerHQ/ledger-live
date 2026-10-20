import type { Account } from "@ledgerhq/types-live";
import type { BitcoinCoinConfig } from "@ledgerhq/coin-bitcoin/config";
import { bindExplorer } from "@ledgerhq/coin-bitcoin/explorer";
import { getWalletAccount } from "@ledgerhq/coin-bitcoin/getWalletAccount";
import { getCurrencyConfiguration } from "../../config";

/** The `config_currency_<id>` coin config of a bitcoin-family currency, read at call time. */
export const getBitcoinCoinConfig = (currencyId: string): BitcoinCoinConfig =>
  getCurrencyConfiguration<BitcoinCoinConfig>(currencyId);

/**
 * The coin config of `account` and its wallet-btc account, bound to the explorer that config names.
 * For the paths that reach the explorer outside the bridge (a deserialized account is unbound).
 */
export const getBoundWalletAccount = (account: Account) => {
  const config = getBitcoinCoinConfig(account.currency.id);
  const walletAccount = bindExplorer(getWalletAccount(account), account.currency, config);
  return { config, walletAccount };
};
