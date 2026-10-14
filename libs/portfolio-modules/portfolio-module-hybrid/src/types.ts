import type {
  Network,
  PortfolioApi,
  RegistrationInput,
} from "@ledgerhq/portfolio-module-framework";

export type Side = "local" | "remote";

/** The networks each side serves, as its `listNetworks` answers. */
export type SideNetworks = Record<Side, Network[]>;

export type SyncOptions = { signal?: AbortSignal };

export type RouteRegistration = (registration: RegistrationInput, networks: SideNetworks) => Side;

export type RouteNetwork = (network: Network, networks: SideNetworks) => Side;

export type HybridPortfolioConfig = {
  local: PortfolioApi & {
    sync?: (portfolioId: string, options?: SyncOptions) => Promise<unknown>;
  };
  remote: PortfolioApi;
  /** Where a registration goes. Default: the remote when it serves the registration's network. */
  routeRegistration?: RouteRegistration;
  /** Where last block, validators, address validation and sequence go. Default: remote first. */
  routeRead?: RouteNetwork;
  /** Where estimate, encode, combine and broadcast go. Default: local first. */
  routeWrite?: RouteNetwork;
};

export type HybridPortfolioApi = PortfolioApi & {
  sync: (portfolioId: string, options?: SyncOptions) => Promise<void>;
};
