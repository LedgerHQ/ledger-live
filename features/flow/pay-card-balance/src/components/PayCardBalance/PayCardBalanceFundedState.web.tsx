import React from "react";
import { AmountDisplay } from "@ledgerhq/lumen-ui-react";
import type { FormattedValue, PayCardBalanceFilterOption } from "./types";
import { BalanceFilterPill } from "./BalanceFilterPill";

type PayCardBalanceFundedStateProps = Readonly<{
  balance: number;
  formatCountervalue: (value: number) => FormattedValue;
  isLoading: boolean;
  allStablecoinsLabel: string;
  selectedOption?: PayCardBalanceFilterOption;
  onOpenFilter: () => void;
}>;

export function PayCardBalanceFundedState({
  balance,
  formatCountervalue,
  isLoading,
  allStablecoinsLabel,
  selectedOption,
  onOpenFilter,
}: PayCardBalanceFundedStateProps) {
  return (
    <div className="flex items-end gap-12" data-testid="pay-card-balance-funded-state">
      <AmountDisplay
        value={balance}
        formatter={formatCountervalue}
        loading={isLoading}
        data-testid="pay-card-balance-amount"
      />
      <BalanceFilterPill
        allStablecoinsLabel={allStablecoinsLabel}
        selectedOption={selectedOption}
        onClick={onOpenFilter}
      />
    </div>
  );
}
