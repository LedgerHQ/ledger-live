import { CurrencyConfig, type Context } from "@ledgerhq/coin-module-framework/config";

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
