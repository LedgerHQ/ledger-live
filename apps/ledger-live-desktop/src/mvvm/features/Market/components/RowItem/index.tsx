import React, { memo } from "react";
import { RowItemView } from "./RowItemView";
import { useRowItemViewModel } from "./useRowItemViewModel";
import { RowItemContainerProps } from "./types";

export const RowItem = memo<RowItemContainerProps>(function RowItem({
  style,
  currency,
  counterCurrency,
  locale,
  isStarred,
  toggleStar,
  range,
}: RowItemContainerProps) {
  const viewModel = useRowItemViewModel({
    currency,
    toggleStar,
    range,
  });

  return (
    <RowItemView
      style={style}
      currency={currency}
      counterCurrency={counterCurrency}
      locale={locale}
      isStarred={isStarred}
      {...viewModel}
    />
  );
});
