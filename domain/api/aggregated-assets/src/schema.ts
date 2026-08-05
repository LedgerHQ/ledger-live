import type { CryptoAssetMeta } from "@domain/entity-aggregated-asset";
import type { InterestRate } from "@domain/entity-interest-rate";
import type { PartialMarketItemResponse } from "./internals/market";

// Raw DADA API wire-format shapes for currency assets
export interface ApiTokenCurrency {
  type: "token_currency";
  id: string;
  contractAddress: string;
  name: string;
  ticker: string;
  units: Array<{ code: string; name: string; magnitude: number }>;
  standard: string;
  parentCurrency?: string | null;
  tokenIdentifier?: string;
  symbol?: string;
  delisted?: boolean;
  disableCountervalue?: boolean;
  descriptor?: unknown;
}

export interface ApiCryptoCurrency {
  type: "crypto_currency";
  id: string;
  name: string;
  ticker: string;
  units: Array<{ code: string; name: string; magnitude: number }>;
  chainId?: string | null;
  confirmationsNeeded?: number;
  symbol?: string;
  coinType?: number;
  family?: string;
  hasSegwit?: boolean;
  hasTokens?: boolean;
  hrp?: string | null;
  disableCountervalue?: boolean;
}

export type ApiAsset = ApiTokenCurrency | ApiCryptoCurrency;

/**
 * A network's id and display name.
 *
 * Not an entity: a network *is* a chain, already modelled by @domain/entity-currency-crypto.
 * This is the wire shape only; resolve to the existing crypto currency rather than duplicating
 * the concept.
 */
export interface NetworkInfo {
  /** Network identifier */
  id: string;
  /** Network display name */
  name: string;
}

/**
 * The server-provided ordering.
 *
 * Not an entity: this is response metadata, not a business object.
 */
export interface CurrenciesOrder {
  /** Sorting key (e.g. "marketCap") */
  key: string;
  /** Sort order (e.g. "desc") */
  order: string;
  /** Ordered list of meta-currency IDs */
  metaCurrencyIds: string[];
}

// Types for raw API response (before transformation)
export interface RawApiResponse {
  /** Grouped crypto assets by meta-currency */
  cryptoAssets: Record<string, CryptoAssetMeta>;
  /** Network information */
  networks: Record<string, NetworkInfo>;
  /** Raw crypto currencies and token currencies from API */
  cryptoOrTokenCurrencies: Record<string, ApiAsset>;
  /** Interest rates for various currencies */
  interestRates: Record<string, InterestRate>;
  /** Market data for currencies */
  markets: Record<string, PartialMarketItemResponse>;
  /** Currency ordering information */
  currenciesOrder: CurrenciesOrder;
}
