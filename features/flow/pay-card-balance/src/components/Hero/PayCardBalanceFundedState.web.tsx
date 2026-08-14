import React from "react";
import { AmountDisplay } from "@ledgerhq/lumen-ui-react";
import { ActionTiles } from "../ActionTiles";
import type { ActionTilesProps } from "../ActionTiles";
import type { FormattedValue, PayCardBalanceFilterOption } from "../../types";
import { BalanceFilterPill } from "../Filter/BalanceFilterPill";

type PayCardBalanceFundedStateProps = Readonly<{
  balance: number;
  formatCountervalue: (value: number) => FormattedValue;
  isLoading: boolean;
  allStablecoinsLabel: string;
  selectedOption?: PayCardBalanceFilterOption;
  onOpenFilter: () => void;
  actionTiles?: ActionTilesProps;
}>;

export function PayCardBalanceFundedState({
  balance,
  formatCountervalue,
  isLoading,
  allStablecoinsLabel,
  selectedOption,
  onOpenFilter,
  actionTiles,
}: PayCardBalanceFundedStateProps) {
  return (
    <div className="flex flex-col gap-24" data-testid="pay-card-balance-funded-state">
      <div className="flex items-end gap-12">
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
      {actionTiles && <ActionTiles {...actionTiles} />}
    </div>
  );
}
