import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { NetworkInfo } from "../schema";
import type { PartialMarketItemResponse } from "../internals/market";

/** DADA names every aggregated asset with this prefix. */
const META_CURRENCY_PREFIX = "urn:crypto:meta-currency:";

export const metaCurrencyId = (slug: string) => `${META_CURRENCY_PREFIX}${slug}`;

/** The per-network token backing a category asset, when it has one. */
type TokenSpec = {
  /** Network id, e.g. `"solana"`. Also added to `networks`. */
  network: string;
  /** Display name of the network, defaults to the capitalised id. */
  networkName?: string;
  /** Token standard, e.g. `"spl"`, `"erc20"`. */
  tokenType: string;
  contractAddress: string;
  magnitude?: number;
};

export type CategoryAssetSpec = {
  ticker: string;
  /** Display name, defaults to the ticker. */
  name?: string;
  /** Id slug, defaults to the lower-cased ticker. */
  slug?: string;
  token?: TokenSpec;
  market?: PartialMarketItemResponse;
};

/**
 * Builds a DADA category response from a list of assets, so a new category is a list rather than
 * another hand-written fixture.
 *
 * Everything not described by the specs comes out empty, which is what the category endpoints
 * actually return: they page server-side and keep one field per asset.
 */
export function buildCategoryResponse(assets: CategoryAssetSpec[]) {
  const resolved = assets.map(asset => {
    const slug = asset.slug ?? asset.ticker.toLowerCase();
    return { ...asset, slug, id: metaCurrencyId(slug), name: asset.name ?? asset.ticker };
  });

  const networks: Record<string, NetworkInfo> = {};
  const cryptoOrTokenCurrencies: Record<string, CryptoOrTokenCurrency> = {};
  const markets: Record<string, PartialMarketItemResponse> = {};

  for (const asset of resolved) {
    if (asset.market) markets[asset.id] = asset.market;
    if (!asset.token) continue;

    const { network, networkName, tokenType, contractAddress, magnitude = 8 } = asset.token;
    networks[network] = {
      id: network,
      name: networkName ?? network[0].toUpperCase() + network.slice(1),
    };

    const tokenId = `${network}/${tokenType}/${asset.slug}`;
    cryptoOrTokenCurrencies[tokenId] = {
      type: "TokenCurrency" as const,
      id: TokenCurrencyIdSchema.parse(tokenId),
      name: asset.name,
      ticker: asset.ticker,
      contractAddress,
      parentCurrencyId: CryptoCurrencyIdSchema.parse(network),
      tokenType,
      units: [{ name: asset.ticker, code: asset.ticker, magnitude }],
    };
  }

  return {
    cryptoAssets: Object.fromEntries(
      resolved.map(asset => [
        asset.id,
        {
          id: asset.id,
          ticker: asset.ticker,
          name: asset.name,
          assetsIds: asset.token
            ? {
                [asset.token.network]:
                  `${asset.token.network}/${asset.token.tokenType}/${asset.slug}`,
              }
            : {},
        },
      ]),
    ),
    networks,
    cryptoOrTokenCurrencies,
    interestRates: {},
    markets,
    currenciesOrder: {
      key: "marketCap",
      order: "desc",
      metaCurrencyIds: resolved.map(asset => asset.id),
    },
  };
}
