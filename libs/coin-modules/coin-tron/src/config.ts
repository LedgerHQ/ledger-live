import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

/** Settings for the Tronify energy-rent provider. */
export type TronifyProviderConfig = {
  /** Base URL of the Tronify REST API (e.g. https://open.tronify.io). */
  url: string;
  /** Channel name agreed with Tronify, sent as `sourceFlag` on every request. */
  sourceFlag: string;
  /**
   * Optional API key, sent as an auth header when present; omit when requests are
   * proxied through a Ledger backend that injects credentials.
   * [assumption] exact header name/scheme to be confirmed with Tronify.
   */
  apiKey?: string;
};

/** Energy-rent provider selection and per-provider settings (ADR-050). */
export type EnergyRentConfig = {
  /** Active provider; the logic-layer switch dispatches on this. */
  provider: "tronify";
  tronify?: TronifyProviderConfig;
};

export type TronConfig = {
  explorer: {
    url: string;
  };
  energyRent?: EnergyRentConfig;
};

export type TronCoinConfig = CurrencyConfig & TronConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<TronCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => TronCoinConfig;
} = buildCoinConfig<TronCoinConfig>();

export default coinConfig;
