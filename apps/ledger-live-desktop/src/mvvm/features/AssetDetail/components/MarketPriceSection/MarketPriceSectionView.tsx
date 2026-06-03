import React from "react";
import { AmountDisplay, Skeleton } from "@ledgerhq/lumen-ui-react";
import { MarketDataSectionTitleSkeleton } from "../MarketDataSection/components/MarketDataSectionTitleSkeleton";
import { MarketPriceMetadata } from "./components/MarketPriceMetadata";
import type { MarketPriceSectionViewModelResult } from "./useMarketPriceSectionViewModel";

type MarketPriceSectionViewProps = Readonly<MarketPriceSectionViewModelResult>;

export function MarketPriceSectionView(viewModel: MarketPriceSectionViewProps) {
  return (
    <div className="flex flex-col gap-8" data-testid="asset-detail-market-price-section">
      {viewModel.showSkeleton ? (
        <>
          <MarketDataSectionTitleSkeleton />
          <Skeleton className="h-48 w-1/2 rounded-8" aria-hidden />
        </>
      ) : (
        <>
          <span className="body-2 text-muted">{viewModel.title}</span>
          <div className="flex flex-wrap items-baseline gap-8">
            {(viewModel.hasPriceData || viewModel.isScrubbing) && viewModel.priceValue != null ? (
              <AmountDisplay
                value={viewModel.priceValue}
                formatter={viewModel.priceFormatter}
                animate={!viewModel.isScrubbing}
                data-testid="asset-detail-market-price"
              />
            ) : (
              <span className="body-1 text-muted" data-testid="asset-detail-market-price">
                -----
              </span>
            )}
            <MarketPriceMetadata
              hasPriceData={viewModel.hasPriceData}
              isScrubbing={viewModel.isScrubbing}
              percentageText={viewModel.percentageText}
              variationText={viewModel.variationText}
              variationVariant={viewModel.variationVariant}
              scrubbedDateLabel={viewModel.scrubbedDateLabel}
              rangeLabel={viewModel.rangeLabel}
            />
          </div>
        </>
      )}
    </div>
  );
}
