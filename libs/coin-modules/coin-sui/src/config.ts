import { type CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import buildCoinConfig from "@ledgerhq/coin-module-framework/config";

/**
 * Per-currency feature flags scoped to coin-sui. `graphql` routes the
 * dual-path reads in `network/sdk.ts` (balances, last block, checkpoint,
 * stakes, validators) through GraphQL when `true`; default OFF — JSON-RPC
 * is the production path until the 2026-07-31 sunset.
 */
export type SuiFeatureFlags = {
  graphql?: boolean;
};

export type SuiConfig = {
  node: {
    url: string;
  };
  features?: SuiFeatureFlags;
};

export type SuiCoinConfig = CurrencyConfig & SuiConfig;

const { setCoinConfig, getCoinConfig } = buildCoinConfig<SuiCoinConfig>();
export default { setCoinConfig, getCoinConfig };
