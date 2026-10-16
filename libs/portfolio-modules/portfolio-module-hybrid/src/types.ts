import type {
  ExtensionMethod,
  Network,
  PortfolioApi,
  PortfolioMode,
} from "@ledgerhq/portfolio-module-framework";

export type Side = "local" | "remote";

export type SyncOptions = { signal?: AbortSignal };

/**
 * The mode of a network, from its coin config (see `portfolioModesFromCoinConfig`). A lookup that
 * fails, or answers no known mode, counts as `DEFAULT_PORTFOLIO_MODE`.
 */
export type ModeOf = (network: Network) => PortfolioMode | Promise<PortfolioMode>;

export type HybridPortfolioConfig = {
  local: PortfolioApi & {
    sync?: (portfolioId: string, options?: SyncOptions) => Promise<unknown>;
  };
  remote: PortfolioApi;
  /** Default: `DEFAULT_PORTFOLIO_MODE` for every network. */
  modeOf?: ModeOf;
};

/** Every extension is routed; one neither side serves answers `METHOD_NOT_ALLOWED`. */
export type HybridPortfolioApi = PortfolioApi &
  Required<Pick<PortfolioApi, ExtensionMethod>> & {
    sync: (portfolioId: string, options?: SyncOptions) => Promise<void>;
  };
