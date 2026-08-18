import { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type CasperConfig = CurrencyConfig & {
  infra: {
    API_CASPER_NODE_ENDPOINT: string;
    API_CASPER_INDEXER: string;
  };
};

/** Kept as a thunk for the classic {@link bridge} path. */
export type CasperCoinConfig = () => CasperConfig;

/** The {@link Context} threaded through the coin-casper low layers (ADR-019). */
export type CasperContext = Context<CasperConfig>;
