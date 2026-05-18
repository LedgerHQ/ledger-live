import React from "react";
import { AmountDisplay, Skeleton } from "@ledgerhq/lumen-ui-react";
import { cn } from "LLD/utils/cn";
import { trendPercentageBody3Styles } from "LLD/shared/trendPercentageStyles";
import type { MarketPriceSectionViewModelResult } from "./useMarketPriceSectionViewModel";

type MarketPriceSectionViewProps = Readonly<MarketPriceSectionViewModelResult>;

export function MarketPriceSectionView(viewModel: MarketPriceSectionViewProps) {
  return (
    <div className="flex flex-col gap-8" data-testid="asset-detail-market-price-section">
      <span className="body-2-semi-bold text-muted">{viewModel.title}</span>
      {viewModel.showSkeleton ? (
        <span aria-hidden className="inline-block">
          <Skeleton className="h-40 w-1/2 rounded-8" />
        </span>
      ) : (
        <div className="flex flex-wrap items-baseline gap-8">
          {viewModel.hasPriceData && viewModel.priceValue != null ? (
            <AmountDisplay
              value={viewModel.priceValue}
              formatter={viewModel.priceFormatter}
              data-testid="asset-detail-market-price"
            />
          ) : (
            <span className={cn("body-1", "text-muted")} data-testid="asset-detail-market-price">
              —
            </span>
          )}
          <div className="flex flex-row items-center gap-4">
            <span
              data-testid="asset-detail-market-price-percent"
              className={trendPercentageBody3Styles({ variant: viewModel.variationVariant })}
            >
              {viewModel.percentageText}
            </span>
            <span
              className={cn(
                "body-3",
                "tabular-nums",
                viewModel.hasVariationData ? "text-base" : "text-muted",
              )}
              data-testid="asset-detail-market-price-fiat-variation"
            >
              {viewModel.variationText}
            </span>
            <span className={cn("body-3", "text-muted")}>
              <span aria-hidden>&middot;</span> {viewModel.dayLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
