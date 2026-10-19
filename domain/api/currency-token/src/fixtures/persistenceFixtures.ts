import { token, type TokenCurrency } from "@domain/entity-currency-token";
import { cryptoAssetsApi } from "../api";
import { PERSISTENCE_VERSION } from "../internals";
import type { WithCryptoAssetsApi } from "../persistence";
import type { PersistedCAL, PersistedTokenEntry } from "../types";

// Shared persistence fixtures. Not re-exported from the package barrel; imported only by tests.

type TokenInput = Parameters<typeof token>[0];
type TokenEndpoint = "findTokenById" | "findTokenByAddressInCurrency";
type HashStatus = "fulfilled" | "pending" | "rejected";

const usdtDefaults: TokenInput = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usdt",
  contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  parentCurrencyId: "ethereum",
  tokenType: "erc20",
  name: "Tether USD",
  ticker: "USDT",
  delisted: false,
  disableCountervalue: false,
  units: [{ name: "USDT", code: "USDT", magnitude: 6 }],
};

export function tokenCurrency(overrides: Partial<TokenInput> = {}): TokenCurrency {
  return token({ ...usdtDefaults, ...overrides } as TokenInput);
}

export function usdtToken(): TokenCurrency {
  return tokenCurrency();
}

type CacheShape = "present" | "absent" | "without-queries";

export function cryptoAssetsState({
  queries = {},
  cache = "present",
}: {
  queries?: Record<string, unknown>;
  cache?: CacheShape;
} = {}): WithCryptoAssetsApi {
  if (cache === "absent") {
    return {} as unknown as WithCryptoAssetsApi;
  }
  if (cache === "without-queries") {
    return { [cryptoAssetsApi.reducerPath]: {} } as unknown as WithCryptoAssetsApi;
  }
  return {
    [cryptoAssetsApi.reducerPath]: { queries },
  } as unknown as WithCryptoAssetsApi;
}

export function fulfilledTokenQuery(
  currency: TokenCurrency,
  {
    endpoint = "findTokenById",
    tokenIdentifier,
    originalArgs,
    status = "fulfilled",
  }: {
    endpoint?: TokenEndpoint;
    tokenIdentifier?: string;
    originalArgs?: object;
    status?: "fulfilled" | "pending";
  } = {},
): Record<string, object> {
  const args =
    originalArgs ??
    (tokenIdentifier === undefined
      ? undefined
      : {
          contract_address: currency.contractAddress,
          network: currency.parentCurrencyId,
          token_identifier: tokenIdentifier,
        });
  const query = {
    status,
    endpointName: endpoint,
    ...(status === "fulfilled"
      ? { data: currency, fulfilledTimeStamp: Date.now() }
      : { data: undefined }),
    ...(args === undefined ? {} : { originalArgs: args }),
  };
  return { [tokenQueryCacheKey(currency, endpoint, tokenIdentifier)]: query };
}

export function syncHashQuery(
  currencyId: string,
  hash?: string,
  status: HashStatus = "fulfilled",
): Record<string, object> {
  return {
    [`getTokensSyncHash("${currencyId}")`]: {
      status,
      endpointName: "getTokensSyncHash",
      ...(hash === undefined ? {} : { data: hash }),
      ...(status === "rejected" ? { error: { status: "FETCH_ERROR" } } : {}),
    },
  };
}

export function persistedCal({
  tokens,
  hashes,
  version = PERSISTENCE_VERSION,
  timestamp = 1000,
}: {
  tokens?: ReadonlyArray<TokenCurrency | PersistedTokenEntry>;
  hashes?: Record<string, string>;
  version?: number;
  timestamp?: number;
} = {}): PersistedCAL {
  const sources = tokens ?? [usdtToken()];
  return {
    version,
    tokens: sources.map(source =>
      isPersistedTokenEntry(source) ? source : { data: source, timestamp },
    ),
    ...(hashes === undefined ? {} : { hashes }),
  } as PersistedCAL;
}

function tokenQueryCacheKey(
  currency: TokenCurrency,
  endpoint: TokenEndpoint,
  tokenIdentifier?: string,
): string {
  if (endpoint === "findTokenById") {
    return `findTokenById(${JSON.stringify({ id: currency.id })})`;
  }
  return `findTokenByAddressInCurrency(${JSON.stringify({
    contract_address: currency.contractAddress,
    network: currency.parentCurrencyId,
    ...(tokenIdentifier === undefined ? {} : { token_identifier: tokenIdentifier }),
  })})`;
}

function isPersistedTokenEntry(
  value: TokenCurrency | PersistedTokenEntry,
): value is PersistedTokenEntry {
  return "timestamp" in value && "data" in value;
}
