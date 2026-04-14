import React from "react";
import { AmountDisplay, Skeleton } from "@ledgerhq/lumen-ui-rnative";
import { useAnalyticsBalanceDisplayViewModel } from "./useAnalyticsBalanceDisplayViewModel";

type Props = {
  hoveredValue?: number | null;
};

/**
 * Balance display for the Analytics screen.
 *
 * Reads the authoritative display state from the portfolioBalanceDisplay Redux slice
 * (written by the Portfolio ViewModel) so both screens stay in sync during navigation.
 *
 * When hoveredValue is provided (user scrubbing the graph) the hovered data-point
 * value is shown instead of the portfolio balance, and the loading indicator is
 * suppressed because a historical value is already resolved.
 */
export function AnalyticsBalanceDisplay({ hoveredValue }: Props) {
  const { value, formatter, discreet, isHovering, isLoading, isBalanceAvailable, shouldDisplayBalanceRefreshRework } =
    useAnalyticsBalanceDisplayViewModel({ hoveredValue });

  if (!isBalanceAvailable) {
    return (
      <Skeleton testID="analytics-balance-skeleton" lx={{ height: "s48", width: "s256" }} />
    );
  }

  return (
    <AmountDisplay
      value={value}
      formatter={formatter}
      hidden={discreet}
      loading={!isHovering && shouldDisplayBalanceRefreshRework && isLoading}
      testID="analytics-balance-amount"
    />
  );
}
