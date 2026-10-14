import type { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

/** Settings for the Tronify energy-rent provider. */
export type TronifyProviderConfig = {
  /** Base URL of the Tronify REST API; defaults to the Ledger proxy (https://tronify.api.live.ledger.com). */
  url: string;
  /**
   * Channel name agreed with Tronify, sent as `sourceFlag` on every request that takes it
   * (all except `uploadHash`, which is keyed by the order id alone).
   */
  sourceFlag: string;
  /**
   * fastTrade rental window in seconds sent with each quote/order. Optional — falls back to 600
   * (matches the UI fee-quote TTL) when the remote coin-config omits it.
   */
  rentalDurationSeconds?: number;
  /**
   * Bandwidth top-up in TRX bundled with each rental to cover the transaction's bandwidth cost.
   * Optional — falls back to 0.8 when the remote coin-config omits it or sets it outside
   * [0.8, 500]; 0 is rejected because a rental without a top-up is priced in TRX, not USDT.
   */
  rentalExtraTrx?: number;
  /**
   * Base58 addresses the rent payment may go to; Tronify rotates through the list in its API docs.
   * Remote coin-config only: missing, empty or any invalid entry disables the option.
   */
  paymentAddresses?: string[];
  /** Most one rental may cost, in USDT, whatever Tronify quotes. Optional — defaults to 10. */
  maxRentAmount?: number;
  /** How far the order may exceed the fee approved on Review, as a fraction. Optional — defaults to 0.05. */
  rentPriceMargin?: number;
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

/** The {@link Context} threaded through the coin-tron API layer (ADR-019). */
export type TronContext = Context<TronCoinConfig>;
