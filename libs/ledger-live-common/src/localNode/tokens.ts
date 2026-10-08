import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { TokenCurrency, TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { getLocalNodeCurrencies } from ".";

/**
 * Issuer of the tokens of the local Stellar network: coin-sandbox issues them from a fixed key, as
 * real issuers (Circle for USDC, …) cannot be recreated without their own keys.
 */
const STELLAR_LOCAL_ISSUER = "GB6VTRLCHXKAU5FKJVNDFLDELU5T7FO25LSMEK7CKR3N22SIN5ZYFLMX";

const stellarLocalToken = (code: string): TokenCurrency => ({
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse(`stellar/asset/${code}:${STELLAR_LOCAL_ISSUER}`),
  parentCurrencyId: CryptoCurrencyIdSchema.parse("stellar"),
  tokenType: "stellar",
  // Stellar reads the asset code from `tokenIdentifier` (sync, send) and `name` (Add asset)
  tokenIdentifier: code,
  name: code,
  ticker: code,
  contractAddress: STELLAR_LOCAL_ISSUER,
  delisted: false,
  // A local token has no market price
  disableCountervalue: true,
  units: [{ name: code, code, magnitude: 7 }],
});

/**
 * Tokens that only exist on a currency's local node, unknown to the crypto-assets service, by
 * currency.
 */
export const LOCAL_NODE_TOKENS: Readonly<Record<string, readonly TokenCurrency[]>> = {
  stellar: [stellarLocalToken("USDC")],
};

/**
 * Where a local node lists the tokens that cannot be known in advance: a contract's address
 * depends on its deployment, so it changes with every new local chain.
 */
export const LOCAL_NODE_TOKEN_LISTS: Readonly<Record<string, string>> = {
  tron: "http://localhost:9090/local/tokens",
};

const TOKEN_LIST_TTL_MS = 10_000;
const tokenLists = new Map<string, { expiresAt: number; tokens: Promise<TokenCurrency[]> }>();

async function fetchTokenList(url: string): Promise<TokenCurrency[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const tokens: TokenCurrency[] = await response.json();
    return tokens.map(token => ({ ...token, id: TokenCurrencyIdSchema.parse(token.id) }));
  } catch {
    // The chain is not up: it has no token to resolve
    return [];
  }
}

/** The tokens `currencyId`'s local node lists, cached briefly: a sync looks them up per asset. */
function listedTokens(currencyId: string): Promise<TokenCurrency[]> {
  const url = LOCAL_NODE_TOKEN_LISTS[currencyId];
  if (!url) return Promise.resolve([]);
  const cached = tokenLists.get(currencyId);
  if (cached && cached.expiresAt > Date.now()) return cached.tokens;
  const tokens = fetchTokenList(url);
  tokenLists.set(currencyId, { expiresAt: Date.now() + TOKEN_LIST_TTL_MS, tokens });
  return tokens;
}

/** The local tokens of `currencyId` known in advance, empty unless it runs on its local node. */
export function getLocalNodeTokens(currencyId: string): readonly TokenCurrency[] {
  return getLocalNodeCurrencies().includes(currencyId) ? (LOCAL_NODE_TOKENS[currencyId] ?? []) : [];
}

/**
 * Lets `store` resolve the local tokens of the currencies running on their local node, known in
 * advance or listed by the node, and delegates every other lookup to it. The selection is read at
 * each lookup, so the order in which the app installs the store and selects the currencies does
 * not matter.
 */
export function withLocalNodeTokens(store: CryptoAssetsStore): CryptoAssetsStore {
  const localTokens = async () =>
    (
      await Promise.all(
        getLocalNodeCurrencies().map(async currencyId => [
          ...getLocalNodeTokens(currencyId),
          ...(await listedTokens(currencyId)),
        ]),
      )
    ).flat();

  return {
    findTokenById: async id =>
      (await localTokens()).find(token => token.id === id) ?? store.findTokenById(id),

    findTokenByAddressInCurrency: async (address, currencyId, tokenIdentifier) =>
      (await localTokens()).find(
        token =>
          token.parentCurrencyId === currencyId &&
          // `decodeTokenAccountId` falls back to looking a token up by its id, as the address
          (token.id === address ||
            (token.contractAddress === address &&
              (tokenIdentifier === undefined || token.tokenIdentifier === tokenIdentifier))),
      ) ?? store.findTokenByAddressInCurrency(address, currencyId, tokenIdentifier),

    getTokensSyncHash: currencyId => store.getTokensSyncHash(currencyId),
  };
}
