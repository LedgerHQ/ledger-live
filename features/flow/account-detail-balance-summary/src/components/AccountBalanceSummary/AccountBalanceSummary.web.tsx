import React from "react";
import { BalanceCard } from "../../internals/BalanceCard";
import type { AccountBalanceSummaryProps } from "./AccountBalanceSummary.types";

export const AccountBalanceSummary = ({
  items,
  discreet = false,
  testID,
}: AccountBalanceSummaryProps) => {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-stretch gap-12" data-testid={testID}>
      {items.map(item => (
        <BalanceCard
          key={item.id}
          item={item}
          discreet={discreet}
          testID={testID ? `${testID}-${item.id}` : undefined}
        />
      ))}
    </div>
  );
};
