import React, { useCallback } from "react";
import type { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { AssetSuggestionsSkeleton } from "LLD/features/SearchAssets/components/AssetSuggestionsSkeleton";
import { useAssetSuggestionsSectionViewModel } from "LLD/features/SearchAssets/hooks/useAssetSuggestionsSectionViewModel";
import { VirtualList } from "LLD/components/VirtualList";
import { useSearchOverlay } from "../SearchOverlayContext";
import { SearchResultRow } from "./SearchResultRow";

// Show 5 expanded rows at a time and let the rest scroll within the popover.
const VISIBLE_RESULTS = 5;
const RESULT_ROW_HEIGHT = 64;
const SKELETON_COUNT = VISIBLE_RESULTS;

export function SearchResultsList() {
  const { results, navigateToAsset } = useSearchOverlay();
  const { locale, counterCurrency } = useAssetSuggestionsSectionViewModel();

  const renderResult = useCallback(
    (currency: MarketCurrencyData) => (
      <SearchResultRow
        currency={currency}
        counterCurrency={counterCurrency}
        locale={locale}
        onClick={navigateToAsset}
      />
    ),
    [counterCurrency, locale, navigateToAsset],
  );

  if (results.isLoading) {
    return (
      <AssetSuggestionsSkeleton
        count={SKELETON_COUNT}
        testIdPrefix="search-results"
        density="default"
      />
    );
  }

  return (
    <div
      className="-mx-8"
      style={{ height: VISIBLE_RESULTS * RESULT_ROW_HEIGHT }}
      data-testid="search-results-list"
    >
      <VirtualList
        items={results.data}
        itemHeight={RESULT_ROW_HEIGHT}
        renderItem={renderResult}
        hasNextPage={results.hasNextPage}
        isLoading={results.isFetchingNextPage}
        onVisibleItemsScrollEnd={results.loadNext}
      />
    </div>
  );
}
