import React, { memo } from "react";
import { MarketRowItemView } from "./MarketRowItemView";
import { useRowItemViewModel } from "LLD/features/Market/components/RowItem/useRowItemViewModel";
import { RowItemContainerProps } from "LLD/features/Market/components/RowItem/types";

type MarketRowItemContainerProps = RowItemContainerProps & {
  loading: boolean;
};

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
  const viewModel = useRowItemViewModel({
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
