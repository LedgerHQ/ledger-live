import React from "react";
import {
  AmountDisplay,
  Skeleton,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-react";
import { trendPercentageBody2Styles } from "LLD/shared/trendPercentageBody2Styles";
import type { MarketPriceSectionViewModelResult } from "./useMarketPriceSectionViewModel";

type MarketPriceSectionViewProps = Readonly<MarketPriceSectionViewModelResult>;

export function MarketPriceSectionView(viewModel: MarketPriceSectionViewProps) {
  return (
    <Subheader className="min-w-0 gap-8" data-testid="asset-detail-market-price-section">
      <SubheaderTitle as="span" className="body-2-semi-bold text-muted">
        {viewModel.title}
      </SubheaderTitle>
      {viewModel.showSkeleton ? (
        <span aria-hidden className="inline-block">
          <Skeleton className="h-40 w-1/2 rounded-8" />
        </span>
      ) : (
        <SubheaderRow className="min-w-0 flex-wrap items-baseline gap-x-8 gap-y-4 px-0">
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
        </SubheaderRow>
      )}
    </Subheader>
  );
}
