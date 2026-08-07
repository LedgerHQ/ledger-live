import buildCoinConfig, {
  type CoinConfig,
  type Context,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type BoilerplateConfig = {
  nodeUrl: string;
  minReserve: number;
};

export type BoilerplateCoinConfig = CurrencyConfig & BoilerplateConfig;

/** The {@link Context} threaded through the coin-module-boilerplate low layers (ADR-019). */
export type BoilerplateContext = Context<BoilerplateCoinConfig>;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<BoilerplateCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => BoilerplateCoinConfig;
} = buildCoinConfig<BoilerplateCoinConfig>();

export default coinConfig;
