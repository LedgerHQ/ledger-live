import { type Context, type CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import buildCoinConfig from "@ledgerhq/coin-module-framework/config";

/** Network transport coin-sui talks to the chain with. */
export type SuiTransport = "grpc" | "graphql";

/**
 * Per-currency feature flags scoped to coin-sui. Populated at app startup by the LLC
 * `setup.ts` closure from the central `suiTransport` feature flag — not from LiveConfig.
 * `transport` selects which endpoint below every `withTransport` dispatcher in
 * `network/sdk.ts` uses; see `getTransport` there for the routing rules and exceptions.
 */
export type SuiFeatureFlags = {
  transport: SuiTransport;
};

export type SuiConfig = {
  node: {
    /** GraphQL endpoint URL — used by `withGraphQLApi` */
    graphqlUrl: string;
    /** gRPC-web base URL (no path) — used by `withGrpcApi` */
    grpcUrl: string;
  };
  features: SuiFeatureFlags;
};

export type SuiCoinConfig = CurrencyConfig & SuiConfig;

/** The {@link Context} threaded through the coin-sui low layers (ADR-019). */
export type SuiContext = Context<SuiCoinConfig>;

const { setCoinConfig, getCoinConfig } = buildCoinConfig<SuiCoinConfig>();
export default { setCoinConfig, getCoinConfig };
