import { CryptoCurrency, LedgerExplorerId } from "@ledgerhq/types-cryptoassets";
import { CommonConfig } from "@ledgerhq/coin-framework/config";

export type EvmConfigInfo = CommonConfig & {
  node?:
    | {
        type: "external";
        uri: string;
      }
    | {
        type: "ledger";
        explorerId: LedgerExplorerId;
      };
  // used by evm coin integration
  explorer?:
    | {
        type: "etherscan" | "blockscout" | "teloscan" | "klaytnfinder";
        uri: string;
      }
    | {
        type: "ledger";
        explorerId: LedgerExplorerId;
      };
  gasTracker?: {
    type: "ledger";
    explorerId: LedgerExplorerId;
  };
};

type EvmCoinConfig = {
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
