import buildCoinConfig, {
  type CoinConfig,
  type Context,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type KaspaCoinConfig = CurrencyConfig;

/** The {@link Context} threaded through the coin-kaspa Alpaca api layer (ADR-019). */
export type KaspaContext = Context<KaspaCoinConfig>;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<KaspaCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => KaspaCoinConfig;
} = buildCoinConfig<KaspaCoinConfig>();

export default coinConfig;
