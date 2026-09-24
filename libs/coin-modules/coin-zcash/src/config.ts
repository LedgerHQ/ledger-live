import { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type ZcashConfigInfo = CurrencyConfig & {
  infra: {
    /** Ledger explorer base URL, where wallet-btc reads the transparent history from. */
    EXPLORER: string;
    /** Zaino gRPC endpoint serving mainnet shielded sync and sends. */
    ZCASH_GRPC_URL: string;
  };
};

type ZcashCoinConfig = {
  info: ZcashConfigInfo;
};

export type CoinConfig = (currencyId: string) => ZcashCoinConfig;

let coinConfig: CoinConfig | undefined;

export const setCoinConfig = (config: CoinConfig): void => {
  coinConfig = config;
};

export const getCoinConfig = (currencyId: string): ZcashCoinConfig => {
  if (!coinConfig) {
    throw new Error("Zcash module config not set");
  }

  return coinConfig(currencyId);
};
