import React from "react";
import { useTranslation } from "react-i18next";
import { StocksSectionView } from "LLD/features/Stocks/StocksSectionView";
import { AssetSuggestionsSection } from "LLD/features/SearchAssets/AssetSuggestionsSection";
import { useSearchOverlay } from "../SearchOverlayContext";
import { CRYPTOS_SUGGESTION_LIMIT, STOCKS_SUGGESTION_LIMIT } from "../useAssetSearchBar";

export function SearchOverlayDefault() {
  const { t } = useTranslation();
  const { suggestions, navigateToAsset, navigateToMarket, navigateToStocksMarket } =
    useSearchOverlay();

  return (
    <div className="flex flex-col gap-24" data-testid="search-overlay-default">
      <AssetSuggestionsSection
        {...suggestions.cryptos}
        title={t("topBar.search.cryptos")}
        testIdPrefix="cryptos"
        limit={CRYPTOS_SUGGESTION_LIMIT}
        navigateToAsset={navigateToAsset}
        onSeeAll={navigateToMarket}
      />
      <StocksSectionView
        {...suggestions.stocks}
        limit={STOCKS_SUGGESTION_LIMIT}
        navigateToAsset={navigateToAsset}
        onSeeAll={navigateToStocksMarket}
        listClassName="-mx-16"
        scrollContainerClassName="px-16"
        hideListGradient
      />
      {/* Perps section (LIVE-29947) */}
    </div>
  );
}
