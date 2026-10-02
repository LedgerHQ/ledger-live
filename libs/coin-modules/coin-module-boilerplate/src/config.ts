import type { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export const DEFAULT_MAX_TX_QUERY = 100;
export const DEFAULT_FALLBACK_FEE = 1000;
export const DEFAULT_FEE_TOO_HIGH_RATIO = 10;
export const DEFAULT_MIN_RESERVE = 0;

export type BoilerplateConfig = {
  node: { url: string };
  indexer: {
    url: string;
    /**
     * Maximum number of transactions requested from the indexer per sync page.
     * @default DEFAULT_MAX_TX_QUERY (100)
     */
    maxTxQuery?: number;
  };
  fees?: {
    /**
     * Fee used when the node simulation fails.
     * @default DEFAULT_FALLBACK_FEE (1000)
     */
    fallbackFee?: number;
    /**
     * The fee-too-high warning is raised when the fee times this ratio exceeds the amount.
     * @default DEFAULT_FEE_TOO_HIGH_RATIO (10)
     */
    tooHighRatio?: number;
  };
  /**
   * Minimum amount an account must hold to stay activated.
   * @default DEFAULT_MIN_RESERVE (0)
   */
  minReserve?: number;
};

export type BoilerplateCoinConfig = CurrencyConfig & BoilerplateConfig;

/** The {@link Context} threaded through the coin-module-boilerplate low layers (ADR-019). */
export type BoilerplateContext = Context<BoilerplateCoinConfig>;
