import type { AccountModuleApi } from "@ledgerhq/account-module-framework";
import { createSingleAddressAccountModule } from "@ledgerhq/account-module-single-address";
import type { AssetInfo, CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import type { AccountModuleBinding, BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import {
  PortfolioApiError,
  type Network,
  type PortfolioApi,
  type PortfolioMode,
  type RegistrationType,
} from "@ledgerhq/portfolio-module-framework";
import { createHybridPortfolio, type HybridPortfolioApi } from "@ledgerhq/portfolio-module-hybrid";
import {
  createLocalPortfolio,
  createMemoryPortfolioStore,
  type LocalNetwork,
  type LocalPortfolioApi,
  type PortfolioStore,
} from "@ledgerhq/portfolio-module-local";
import { createPortfolioServiceClient } from "@ledgerhq/portfolio-module-portfolio-service";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { networkOf, portfolioModeOf, readPortfolioServiceConfig } from "./config";
import { boundedListingModule, type BoundedListing } from "./listing";

/** What the portfolio layer of a currency is built from: Ledger Wallet's modules and catalog. */
export type PortfolioDeps = {
  binding: AccountModuleBinding | undefined;
  coinModuleApi: CoinModuleApi<any, any, any>;
  context: Context<any>;
  bridgeApi: Pick<
    BridgeApi,
    | "getTokenFromAsset"
    | "getAssetFromToken"
    | "balanceOptions"
    | "syncVersion"
    | "partitionsNativeBalance"
    | "getHeldNativeAmount"
  >;
};

/**
 * What a bridge call opens the portfolio for: a sync or a scan reads it, the write path only
 * writes, and registers the account on the side writing alone.
 */
export type PortfolioPurpose = "read" | "write";

export type TokenLookup = (asset: AssetInfo) => Promise<TokenCurrency | undefined>;

/**
 * A remote side without a service: it holds no portfolio (NOT_FOUND, so the reads of both sides
 * still answer the local one) and serves nothing else (UNAVAILABLE, saying `why`).
 */
function serviceless(notFound: string, why: string): PortfolioApi {
  const unavailable = async (): Promise<never> => {
    throw new PortfolioApiError("UNAVAILABLE", why);
  };
  return {
    getPortfolio: async portfolioId => {
      throw new PortfolioApiError("NOT_FOUND", `Portfolio ${portfolioId} not found: ${notFound}`);
    },
    createPortfolio: unavailable,
    addRegistrations: unavailable,
    removeRegistrations: unavailable,
    addAddresses: unavailable,
    getUpdates: unavailable,
    getPortfolioBalance: unavailable,
    getPortfolioBalanceHistory: unavailable,
    listNetworks: async () => [],
    getLastBlock: unavailable,
    getValidators: unavailable,
    validateAddress: unavailable,
    getNextSequence: unavailable,
    estimateTransactionFee: unavailable,
    encodeTransaction: unavailable,
    combineTransaction: unavailable,
    broadcastTransaction: unavailable,
  };
}

/** The remote side while no portfolio-service url is configured. */
export const unavailablePortfolio: PortfolioApi = serviceless(
  "no portfolio-service url is configured",
  "No portfolio-service url: set config_portfolio_service.url to serve a chain in remote or hybrid mode",
);

/**
 * The remote side of a chain in `local` mode: no service at all, so a call the router sends to
 * both sides (a portfolio, a registration, an account extension of an account the local side does
 * not hold) never reaches the service, which would learn the account (an xpub for bitcoin).
 */
export const localModeRemote: PortfolioApi = serviceless(
  "the chain is in local mode",
  "The chain is in local mode: the portfolio-service serves none of its calls",
);

/**
 * The family's token lookup, asked once per asset for the call that opened the portfolio: the
 * balance entries of the local side and the token accounts of the shape share it. None when the
 * family has none.
 */
export function memoisedTokenLookup(lookup: TokenLookup | undefined): TokenLookup | undefined {
  if (!lookup) return undefined;
  const tokens = new Map<string, Promise<TokenCurrency | undefined>>();
  return asset => {
    const { assetReference = "", assetOwner = "" } = asset as {
      assetReference?: string;
      assetOwner?: string;
    };
    const key = `${asset.type}|${assetReference}|${assetOwner}`;
    let token = tokens.get(key);
    if (!token) {
      token = lookup(asset);
      tokens.set(key, token);
    }
    return token;
  };
}

/**
 * The account module of the currency: the binding's, or the single-address one on its coin module,
 * listing under the operation history bound when `listing` gives one (an account's read).
 */
export function accountModuleOf(
  currency: CryptoCurrency,
  { binding, coinModuleApi, bridgeApi }: PortfolioDeps,
  listing?: BoundedListing,
): AccountModuleApi<any> {
  const { balanceOptions } = bridgeApi;
  if (binding) return binding.create(coinModuleApi, currency.id);
  return createSingleAddressAccountModule(
    listing ? boundedListingModule(coinModuleApi, listing) : coinModuleApi,
    balanceOptions ? { balanceOptions } : {},
  );
}

/**
 * The network of the currency, as the local side serves it: Ledger Wallet's coin module and account
 * module (handing them over is wiring, not a call), its catalog lookup (`resolveAsset`) and the
 * balance options of its family.
 */
export function localNetworkOf(
  currency: CryptoCurrency,
  deps: PortfolioDeps,
  {
    derivationMode = "",
    derivationPath = "",
    registrationTypes = [],
    getTokenFromAsset,
    listing,
  }: {
    derivationMode?: string;
    derivationPath?: string;
    registrationTypes?: RegistrationType[];
    getTokenFromAsset: TokenLookup | undefined;
    /** The bounded listing of the account a read syncs. */
    listing?: BoundedListing;
  },
): LocalNetwork {
  const { coinModuleApi, context, bridgeApi } = deps;
  const { balanceOptions } = bridgeApi;
  return {
    currencyId: currency.id,
    context,
    coinModule: coinModuleApi,
    accountModule: accountModuleOf(currency, deps, listing),
    derivationMode,
    derivationPath,
    nativeAsset: {
      name: currency.name,
      ticker: currency.ticker,
      decimals: currency.units[0].magnitude,
    },
    registrationTypes,
    ...(getTokenFromAsset
      ? {
          resolveAsset: async (asset: AssetInfo) => {
            const token = await getTokenFromAsset(asset);
            return (
              token && {
                cal_id: token.id,
                name: token.name,
                ticker: token.ticker,
                decimals: token.units[0].magnitude,
              }
            );
          },
        }
      : {}),
    ...(balanceOptions ? { balanceOptions } : {}),
  };
}

/** The sides of a portfolio: the local one on `localNetwork`, the service, and their router. */
export type PortfolioSides = {
  local: LocalPortfolioApi;
  remote: PortfolioApi;
  /** Routes each call to the side its network's mode names. */
  portfolio: HybridPortfolioApi;
  store: PortfolioStore;
};

/**
 * The local side (its store in memory: Ledger Wallet is that store, seeding it from the account),
 * the service when the mode uses one (`hybrid`, `remote`) and a url is configured, and the router
 * between them. A `local` chain wires no service. `generateId` names the registrations of the local
 * side, for a portfolio that registers any.
 */
export function portfolioSides(
  network: Network,
  localNetwork: LocalNetwork,
  mode: PortfolioMode,
  generateId?: () => string,
): PortfolioSides {
  const service = readPortfolioServiceConfig();
  const store = createMemoryPortfolioStore();
  const local = createLocalPortfolio({
    networks: { [network]: localNetwork },
    store,
    ...(generateId ? { generateId } : {}),
  });
  let remote: PortfolioApi = localModeRemote;
  if (mode !== "local") {
    remote = service.url
      ? createPortfolioServiceClient({ baseUrl: service.url })
      : unavailablePortfolio;
  }
  return {
    local,
    remote,
    portfolio: createHybridPortfolio({ local, remote, modeOf: () => mode }),
    store,
  };
}

/** The portfolio layer of a network, for the calls no account is opened for. */
export type NetworkPortfolio = {
  /** Routes each call to the side the network's mode names. */
  portfolio: HybridPortfolioApi;
  network: Network;
  mode: PortfolioMode;
};

/**
 * Opens the portfolio layer of a currency for a network-level call (broadcast, raw signing, address
 * validation, the scan's address lookup, the chain reads of an entry point, the family helpers): the
 * same local, remote and hybrid wiring as an account's, with no registration. Reads and writes are
 * wired alike, the router sending each to the side the mode names for it; `purpose` says which the
 * caller makes.
 */
export async function openNetworkPortfolio(
  currency: CryptoCurrency,
  deps: PortfolioDeps,
  _purpose: PortfolioPurpose,
): Promise<NetworkPortfolio> {
  const network = networkOf(currency.id);
  const mode = await portfolioModeOf(network);
  const localNetwork = localNetworkOf(currency, deps, {
    getTokenFromAsset: memoisedTokenLookup(deps.bridgeApi.getTokenFromAsset),
  });
  const { portfolio } = portfolioSides(network, localNetwork, mode);
  return { portfolio, network, mode };
}
