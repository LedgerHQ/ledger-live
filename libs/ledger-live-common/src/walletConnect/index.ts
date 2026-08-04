import { CryptoOrTokenCurrency } from "@domain/entity-currency";

/**
 * The full list comes from the WalletConnect live-app repo
 * https://github.com/LedgerHQ/wallet-connect-live-app/blob/main/src/data/network.config.ts
 *
 * Mainnet currencies supported across all namespaces (EIP-155, BIP-122, XRPL, Solana, Tezos).
 */

export const mainnetCurrenciesSupportedOnWalletConnect = [
  // EIP-155 mainnet chains
  "ethereum",
  "polygon",
  "bsc",
  "rsk",
  "optimism",
  "arbitrum",
  "avalanche_c_chain",
  "base",
  "core",
  "monad",
  "adi",
  "sei_evm",
  "somnia",
  "etherlink",
  "zero_gravity",
  "robinhood",
  "arc",
  // BIP-122 mainnet chains
  "bitcoin",
  "litecoin",
  "dogecoin",
  // XRPL
  "ripple",
  // Solana
  "solana",
  // Tezos
  "tezos",
];

// Testnet / devnet chains
export const testnetAndDevnetCurrenciesSupportedOnWalletConnect = [
  "optimism_sepolia",
  "arbitrum_sepolia",
  "ethereum_sepolia",
  "base_sepolia",
  "bitcoin_testnet",
  "solana_testnet",
  "solana_devnet",
  "monad_testnet",
  "arc_testnet",
];

/**
 * @deprecated Use `mainnetCurrenciesSupportedOnWalletConnect` for the mainnet-only list,
 * or `testnetAndDevnetCurrenciesSupportedOnWalletConnect` for testnet/devnet entries.
 * This export is kept as the full union (mainnet + testnet/devnet) for backward compatibility.
 */
export const currenciesSupportedOnWalletConnect = [
  ...mainnetCurrenciesSupportedOnWalletConnect,
  ...testnetAndDevnetCurrenciesSupportedOnWalletConnect,
];

const supportedCurrenciesSet = new Set(currenciesSupportedOnWalletConnect);

export const isWalletConnectSupported = (currency: CryptoOrTokenCurrency) =>
  supportedCurrenciesSet.has(currency.id);
