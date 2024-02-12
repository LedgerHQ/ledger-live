import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

/**
 * The full list comes from the WalletConnect repo
 * https://github.com/LedgerHQ/wallet-connect-live-app/blob/ce792e808115308ef7d36e9954bc9dae23fd8f9e/src/data/network.config.ts#L84C14-L84C31
 */

export const currenciesSupportedOnWalletConnect = [
  "ethereum",
  "polygon",
  "bsc",
  "optimism",
  "arbitrum",
  "avalanche_c_chain",
  "ethereum_goerli",
  "optimism_goerli",
];

export const isWalletConnectSupported = (currency: CryptoOrTokenCurrency) =>
  currenciesSupportedOnWalletConnect.includes(currency.id);
