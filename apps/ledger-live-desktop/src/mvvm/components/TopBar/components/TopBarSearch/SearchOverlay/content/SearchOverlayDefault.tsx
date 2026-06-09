import React from "react";
import { StocksSectionView } from "LLD/features/Stocks/StocksSectionView";
import { useSearchOverlay } from "../SearchOverlayContext";
import { STOCKS_SUGGESTION_LIMIT } from "../useAssetSearchBar";

export function SearchOverlayDefault() {
  const { suggestions, navigateToAsset, navigateToStocksMarket } = useSearchOverlay();

  return (
    <div className="flex flex-col gap-24" data-testid="search-overlay-default">
      {/* CryptoList section (LIVE-29945): cryptos + stablecoins */}
      <StocksSectionView
        {...suggestions.stocks}
        limit={STOCKS_SUGGESTION_LIMIT}
        navigateToAsset={navigateToAsset}
        onSeeAll={navigateToStocksMarket}
      />
      {/* Perps section (LIVE-29947) */}
    </div>
  );
}
