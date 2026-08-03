import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

/** Settings for the Tronify energy-rent provider. */
export type TronifyProviderConfig = {
  /** Base URL of the Tronify REST API (e.g. https://open.tronify.io). */
  url: string;
  /**
   * Channel name agreed with Tronify, sent as `sourceFlag` on every request that takes it
   * (all except `uploadHash`, which is keyed by the order id alone).
   */
  sourceFlag: string;
  /**
   * Optional API key, sent as an auth header when present; omit when requests are
   * proxied through a Ledger backend that injects credentials.
   * [assumption] exact header name/scheme to be confirmed with Tronify.
   */
  apiKey?: string;
};

/**
 * Energy-rent provider selection and its settings (ADR-050). The chosen provider's settings are
 * required alongside its id, so a provider cannot be selected without being configured. Adding a
 * provider turns this into a union of such pairs.
 *
 * This is a compile-time contract only — the value reaches us as unvalidated remote coin-config
 * JSON, so the client still guards at runtime.
 */
export type EnergyRentConfig = {
  /** Active provider; the logic-layer switch dispatches on this. */
  provider: "tronify";
  tronify: TronifyProviderConfig;
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
