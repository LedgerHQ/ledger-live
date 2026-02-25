import { CurrencyConfig } from "@ledgerhq/coin-framework/config";
import { CryptoCurrency, LedgerExplorerId } from "@ledgerhq/types-cryptoassets";

export type EvmConfig = {
  node:
    | {
        type: "external";
        uri: string;
      }
    | {
        type: "ledger";
        explorerId: LedgerExplorerId;
      };
  explorer:
    | {
        type: "etherscan" | "blockscout" | "teloscan" | "klaytnfinder" | "corescan";
        noCache?: boolean | undefined;
        uri: string;
      }
    | {
        type: "ledger";
        explorerId: LedgerExplorerId;
        batchSize?: number | undefined;
      }
    | {
        type: "none";
        uri?: never;
        explorerId?: never;
      };
  gasTracker?: {
    type: "ledger";
    explorerId: LedgerExplorerId;
  };
  showNfts: boolean;
};

export type EvmConfigInfo = CurrencyConfig & EvmConfig;

export type EvmCoinConfig = {
  info: EvmConfigInfo;
};

export type CoinConfig = (currency: CryptoCurrency) => EvmCoinConfig;

let coinConfig: CoinConfig | undefined;

export const setCoinConfig = (config: CoinConfig): void => {
  coinConfig = config;
};

export const getCoinConfig = (currency: CryptoCurrency): EvmCoinConfig => {
  if (!coinConfig) {
    throw new Error("EVM module config not set");
  }

  return coinConfig(currency);
};
