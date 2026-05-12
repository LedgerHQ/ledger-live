import { type CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import buildCoinConfig from "@ledgerhq/coin-module-framework/config";

/**
 * Per-currency feature flags scoped to coin-sui. Populated at app startup by
 * the LLC `setup.ts` closure from the central `suiGraphqlTransport` feature
 * flag — not from LiveConfig. `graphql=true` routes read-side dispatch
 * (`network/sdk.ts`) through GraphQL; write-side and SDK-internal callers
 * always use `node.url` (JSON-RPC).
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
