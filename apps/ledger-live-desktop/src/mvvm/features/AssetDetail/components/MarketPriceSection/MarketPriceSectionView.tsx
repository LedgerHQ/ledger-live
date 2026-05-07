import React from "react";
import { AmountDisplay, Skeleton } from "@ledgerhq/lumen-ui-react";
import { trendPercentageBody2Styles } from "LLD/shared/trendPercentageBody2Styles";
import type { MarketPriceSectionViewModelResult } from "./useMarketPriceSectionViewModel";

type MarketPriceSectionViewProps = Readonly<MarketPriceSectionViewModelResult>;

export function MarketPriceSectionView(viewModel: MarketPriceSectionViewProps) {
  return (
    <div className="flex flex-col gap-8" data-testid="asset-detail-market-price-section">
      <p className="body-2-semi-bold text-muted">{viewModel.title}</p>
      {viewModel.showSkeleton ? (
        <Skeleton className="h-40 w-1/2 rounded-8" aria-hidden />
      ) : (
        <div className="flex items-baseline gap-8">
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
          <div className="flex items-baseline gap-4">
            <span
              data-testid="asset-detail-market-price-percent"
              className={trendPercentageBody2Styles({ variant: viewModel.variationVariant })}
            >
              {viewModel.percentageText}
            </span>
            <span
              className={`body-3 tabular-nums ${viewModel.hasVariationData ? "text-base" : "text-muted"}`}
              data-testid="asset-detail-market-price-fiat-variation"
            >
              {viewModel.variationText}
            </span>
            <span className="body-2 text-muted">&middot; {viewModel.dayLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
}
