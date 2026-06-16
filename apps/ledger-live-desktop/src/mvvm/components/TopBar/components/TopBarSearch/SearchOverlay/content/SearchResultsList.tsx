import React from "react";
import { AssetSuggestionsSkeleton } from "LLD/features/SearchAssets/components/AssetSuggestionsSkeleton";
import { useAssetSuggestionsSectionViewModel } from "LLD/features/SearchAssets/hooks/useAssetSuggestionsSectionViewModel";
import { useSearchOverlay } from "../SearchOverlayContext";
import { SearchResultRow } from "./SearchResultRow";

const SKELETON_COUNT = 6;

export function SearchResultsList() {
  const { results, navigateToAsset } = useSearchOverlay();
  const { locale, counterCurrency } = useAssetSuggestionsSectionViewModel();

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
    <div className="flex flex-col -mx-8" data-testid="search-results-list">
      {results.data.map(currency => (
        <SearchResultRow
          key={currency.id}
          currency={currency}
          counterCurrency={counterCurrency}
          locale={locale}
          onClick={navigateToAsset}
        />
      ))}
    </div>
  );
}
