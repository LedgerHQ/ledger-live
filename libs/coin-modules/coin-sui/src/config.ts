import { type CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import buildCoinConfig from "@ledgerhq/coin-module-framework/config";

/**
 * Per-currency feature flags scoped to coin-sui. Populated at app startup by
 * the LLC `setup.ts` closure from the central `suiGraphqlTransport` feature
 * flag — not from LiveConfig. `graphql=true` routes every `withTransport`
 * dispatcher in `network/sdk.ts` (reads + writes — balances, stakes, last
 * block, checkpoint, operations, validators, transaction construction, fee
 * dry-run, broadcast) through GraphQL via `node.graphqlUrl`. Callers bound
 * directly to `withApi` (none in the current hot path) always use `node.url`.
 */
export type SuiFeatureFlags = {
  graphql: boolean;
};

export type SuiConfig = {
  node: {
    /** JSON-RPC fullnode URL — used by `withApi` */
    url: string;
    /** GraphQL endpoint URL — used by `withGraphQLApi` */
    graphqlUrl: string;
  };
  features: SuiFeatureFlags;
};

export type SuiCoinConfig = CurrencyConfig & SuiConfig;

const { setCoinConfig, getCoinConfig } = buildCoinConfig<SuiCoinConfig>();
export default { setCoinConfig, getCoinConfig };
