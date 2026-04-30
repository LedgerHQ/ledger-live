import { type CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import buildCoinConfig from "@ledgerhq/coin-module-framework/config";

/**
 * Per-currency feature flags scoped to coin-sui. Lives inside `SuiConfig`
 * (rather than the framework-level `status.features`) so the migration
 * machinery can be toggled without touching the shared coin-module-framework
 * surface.
 *
 * **graphql** — when `true`, the dual-path read functions in
 * `network/sdk.ts` (balances, last block, checkpoint, stakes, validators)
 * route through the GraphQL transport instead of JSON-RPC. Flag default
 * is OFF: the JSON-RPC client is still the production path until the
 * 2026-07-31 sunset and the staged migration completes.
 *
 * Treated as opt-in / sticky-per-environment for now. A real feature-flag
 * service (e.g. GrowthBook gradual rollout) can replace the read-side of
 * this in a later PR without changing call-sites.
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
