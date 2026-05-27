import React from "react";
import { AmountDisplay, Skeleton } from "@ledgerhq/lumen-ui-react";
import { trendPercentageBody2Styles } from "LLD/shared/trendPercentageStyles";
import { MarketDataSectionTitleSkeleton } from "../MarketDataSection/components/MarketDataSectionTitleSkeleton";
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
            {viewModel.hasPriceData && viewModel.priceValue != null ? (
              <AmountDisplay
                value={viewModel.priceValue}
                formatter={viewModel.priceFormatter}
                data-testid="asset-detail-market-price"
              />
            ) : (
              <span className="body-1 text-muted" data-testid="asset-detail-market-price">
                —
              </span>
            )}
            <div className="flex flex-row items-center gap-4">
              <span
                data-testid="asset-detail-market-price-percent"
                className={trendPercentageBody2Styles({ variant: viewModel.variationVariant })}
              >
                {viewModel.percentageText}
              </span>
              <span
                className="body-2 tabular-nums text-muted"
                data-testid="asset-detail-market-price-fiat-variation"
              >
                {viewModel.variationText}
              </span>
              <span className="body-2 text-muted">
                <span aria-hidden>&middot;</span> {viewModel.dayLabel}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
