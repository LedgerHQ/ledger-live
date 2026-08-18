import { CurrencyConfig, CoinConfig, type Context } from "@ledgerhq/coin-module-framework/config";
import { MissingCoinConfig } from "@ledgerhq/coin-module-framework/errors";

export type StacksCurrencyConfig = CurrencyConfig & {
  config_currency_stacks: {
    type: "object";
    default: {
      status: {
        type: "active";
      };
    };
  };
};

export type StacksCoinConfig = () => StacksCurrencyConfig;

/** The {@link Context} threaded through the coin-stacks API layer (ADR-019). */
export type StacksContext = Context<StacksCurrencyConfig>;

let coinConfig: CoinConfig<StacksCurrencyConfig> | undefined;

export function setCoinConfig(config: CoinConfig<StacksCurrencyConfig>): void {
  coinConfig = config;
}

export function getCoinConfig(): StacksCurrencyConfig {
  if (!coinConfig) {
    throw new MissingCoinConfig();
  }

  return coinConfig();
}
