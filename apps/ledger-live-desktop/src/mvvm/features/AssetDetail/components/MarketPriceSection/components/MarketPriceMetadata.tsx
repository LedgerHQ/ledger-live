import React from "react";
import { trendPercentageBody2Styles } from "LLD/shared/trendPercentageStyles";

type MarketPriceMetadataProps = Readonly<{
  hasPriceData: boolean;
  isScrubbing: boolean;
  percentageText: string;
  variationText: string;
  variationVariant: "positive" | "negative" | "neutral";
  scrubbedDateLabel?: string;
  rangeLabel: string;
}>;

type RangeLabelProps = Readonly<{
  isScrubbing: boolean;
  label: string;
}>;

function RangeLabel({ isScrubbing, label }: RangeLabelProps) {
  return (
    <span className="body-2 text-muted">
      {!isScrubbing && <span aria-hidden>&middot; </span>}
      {label}
    </span>
  );
}

type PriceVariationMetricsProps = Readonly<{
  percentageText: string;
  variationText: string;
  variationVariant: "positive" | "negative" | "neutral";
}>;

function PriceVariationMetrics({
  percentageText,
  variationText,
  variationVariant,
}: PriceVariationMetricsProps) {
  return (
    <>
      <span
        data-testid="asset-detail-market-price-percent"
        className={trendPercentageBody2Styles({ variant: variationVariant })}
      >
        {percentageText}
      </span>
      <span
        className="body-2 tabular-nums text-muted"
        data-testid="asset-detail-market-price-fiat-variation"
      >
        {variationText}
      </span>
    </>
  );
}

export function MarketPriceMetadata({
  hasPriceData,
  isScrubbing,
  percentageText,
  variationText,
  variationVariant,
  scrubbedDateLabel,
  rangeLabel,
}: MarketPriceMetadataProps) {
  const dateLabel = scrubbedDateLabel ?? rangeLabel;

  if (!hasPriceData) {
    return <RangeLabel isScrubbing={isScrubbing} label={dateLabel} />;
  }

  return (
    <div className="flex flex-row items-center gap-4">
      <PriceVariationMetrics
        percentageText={percentageText}
        variationText={variationText}
        variationVariant={variationVariant}
      />
      <RangeLabel isScrubbing={isScrubbing} label={dateLabel} />
    </div>
  );
}
