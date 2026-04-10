import type {
  AccountLike,
  AssetsDistribution,
  DistributionItem,
  NetworkDistributionDetail,
} from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

/** Minimal shape of DADA's CryptoAssetMeta needed by buildAssetDistribution. */
export interface CryptoAssetMetaLike {
  id: string;
  assetsIds: Record<string, string>;
}

/** Minimal shape of the DADA market entry needed for marketId resolution. */
export interface MarketEntryLike {
  id?: string;
}

/** Minimal shape of the DADA AssetsData needed by buildAssetDistribution. */
export interface AssetsDataLike {
  cryptoAssets: Record<string, CryptoAssetMetaLike>;
  markets: Record<string, MarketEntryLike>;
}

export interface BuildAssetDistributionOpts {
  showEmptyAccounts?: boolean;
  hideEmptyTokenAccount?: boolean;
}

export type MetaGroup = {
  metaCurrencyId: string;
  currency: CryptoCurrency | TokenCurrency;
  accounts: AccountLike[];
  countervalue: number;
  amount: number;
  networks: Map<string, NetworkDistributionDetail>;
  marketId?: string;
};

export type CurrencyLookups = {
  /** currency.id -> metaCurrencyId */
  currencyToMetaId: Record<string, string>;
  /** metaCurrencyId -> primary asset ID (first entry in assetsIds) */
  primaryAssets: Record<string, string>;
};

export type { AccountLike, AssetsDistribution, DistributionItem };
