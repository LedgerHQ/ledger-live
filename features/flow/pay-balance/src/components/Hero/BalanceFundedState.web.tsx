import React from "react";
import { AmountDisplay } from "@ledgerhq/lumen-ui-react";
import type { FormattedValue, BalanceFilterOption } from "../../types";
import { BalanceFilterPill } from "../Filter/BalanceFilterPill";

type BalanceFundedStateProps = Readonly<{
  balance: number;
  formatCountervalue: (value: number) => FormattedValue;
  isLoading: boolean;
  allStablecoinsLabel: string;
  selectedOption?: BalanceFilterOption;
  onOpenFilter: () => void;
  discreet?: boolean;
  /** Desktop toggles discreet mode from the top bar, so the amount is not pressable here. */
  onToggleDiscreetMode?: () => void;
}>;

export function BalanceFundedState({
  balance,
  formatCountervalue,
  isLoading,
  allStablecoinsLabel,
  selectedOption,
  onOpenFilter,
  discreet,
}: BalanceFundedStateProps) {
  return (
    <div className="flex flex-col gap-24" data-testid="pay-card-balance-funded-state">
      <div className="flex items-end gap-12">
        <AmountDisplay
          value={balance}
          formatter={formatCountervalue}
          loading={isLoading}
          hidden={discreet}
          data-testid="pay-card-balance-amount"
        />
        <BalanceFilterPill
          allStablecoinsLabel={allStablecoinsLabel}
          selectedOption={selectedOption}
          onClick={onOpenFilter}
        />
      </div>
    </div>
  );
}
