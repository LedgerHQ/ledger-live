import type {
  AccountLike,
  AssetsDistribution,
  DistributionItem,
  NetworkDistributionDetail,
} from "@ledgerhq/types-live";
import type { CryptoAssetMeta } from "@domain/entity-aggregated-asset";
import type { AssetsData } from "@domain/api-aggregated-assets";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";

/* Only what buildAssetDistribution reads. Derived from the domain types so they cannot drift. */

/** `ticker` stays optional: the mismatch guard is skipped when it is absent. */
export type CryptoAssetMetaLike = Pick<CryptoAssetMeta, "id" | "assetsIds"> &
  Partial<Pick<CryptoAssetMeta, "ticker">>;

export type MarketEntryLike = Pick<AssetsData["markets"][string], "id">;

export type AssetsDataLike = {
  cryptoAssets: Record<string, CryptoAssetMetaLike>;
  markets: Record<string, MarketEntryLike>;
};

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
