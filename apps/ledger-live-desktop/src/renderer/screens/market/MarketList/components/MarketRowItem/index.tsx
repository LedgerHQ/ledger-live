import React, { memo } from "react";
import { MarketRowItemView } from "./MarketRowItemView";
import { useMarketRowItemViewModel } from "LLD/features/Market/components/MarketRowItem/useMarketRowItemViewModel";
import { MarketRowItemContainerProps } from "LLD/features/Market/components/MarketRowItem/types";

export const MarketRowItem = memo<MarketRowItemContainerProps>(function MarketRowItem({
  style,
  currency,
  counterCurrency,
  locale,
  loading,
  isStarred,
  toggleStar,
  range,
}: MarketRowItemContainerProps) {
  const viewModel = useMarketRowItemViewModel({
    currency,
    toggleStar,
    range,
  });

  return (
    <MarketRowItemView
      style={style}
      loading={loading}
      currency={currency}
      counterCurrency={counterCurrency}
      locale={locale}
      isStarred={isStarred}
      {...viewModel}
    />
  );
});
