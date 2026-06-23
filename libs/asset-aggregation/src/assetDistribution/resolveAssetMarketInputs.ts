import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { DistributionItem } from "@ledgerhq/types-live";
import type { MarketStateSlice } from "./resolveDistributionItem";

export type AssetMarketInputs = {
  /** Id to use against the market API (CoinGecko-style id, e.g. "binancecoin"). */
  marketApiId?: string;
  /** Known Ledger currency ids to hint the DADA endpoint. */
  knownLedgerIds?: readonly string[];
  /** Known market id, used when the market query is loading / errors out. */
  knownMarketId?: string;
};

export type ResolveAssetMarketInputsParams = {
  distributionItem?: DistributionItem;
  marketState?: MarketStateSlice & { id?: string };
  currency?: CryptoOrTokenCurrency;
  /** Last-resort fallback (e.g. the raw route param the navigation was opened with). */
  fallbackId?: string;
};

/**
 * Resolves the inputs needed by `useAssetMarketData` from whatever context is
 * available on the AssetDetail screen — distribution lookup, market navigation
 * hint, or a raw currency. Centralised so desktop and mobile stay in sync.
 *
 * Precedence for `marketApiId`:
 *  1. `distributionItem.marketId`     — the resolved market id from the wallet
 *  2. `distributionItem.slug`         — slug derived from the DADA meta-currency
 *  3. `distributionItem.currency.id`  — the resolved ledger currency id from the wallet
 *  4. `marketState.id`                — hint passed when navigating from Market
 *  5. `currency.id`                   — last-resort, only correct for assets whose
 *                                       ledger id == market id (e.g. BTC)
 *  6. `fallbackId`                    — raw route param
 */
export function resolveAssetMarketInputs({
  distributionItem,
  marketState,
  currency,
  fallbackId,
}: ResolveAssetMarketInputsParams): AssetMarketInputs {
  const marketApiId =
    distributionItem?.marketId ??
    distributionItem?.slug ??
    distributionItem?.currency.id ??
    marketState?.id ??
    currency?.id ??
    fallbackId;

  const knownLedgerIds = resolveKnownLedgerIds({ distributionItem, currency, marketState });

  return {
    marketApiId,
    knownLedgerIds,
    knownMarketId: marketState?.id,
  };
}

function resolveKnownLedgerIds({
  distributionItem,
  currency,
  marketState,
}: Pick<ResolveAssetMarketInputsParams, "distributionItem" | "currency" | "marketState">):
  | readonly string[]
  | undefined {
  if (distributionItem) return [distributionItem.currency.id];
  if (marketState?.ledgerIds?.length) return marketState.ledgerIds;
  if (currency) return [currency.id];
  return undefined;
}
