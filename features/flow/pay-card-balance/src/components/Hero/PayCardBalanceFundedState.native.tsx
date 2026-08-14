import React from "react";
import { AmountDisplay, Box } from "@ledgerhq/lumen-ui-rnative";
import { ActionTiles } from "../ActionTiles";
import type { ActionTilesProps } from "../ActionTiles";
import type { FormattedValue, PayCardBalanceFilterOption } from "../../types";
import { BalanceFilterSelect } from "../Filter/BalanceFilterSelect.native";

type PayCardBalanceFundedStateProps = Readonly<{
  balance: number;
  formatCountervalue: (value: number) => FormattedValue;
  isLoading: boolean;
  actionTiles?: ActionTilesProps;
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
  actionTiles,
}: PayCardBalanceFundedStateProps) {
  return (
    <Box
      lx={{ alignItems: "center", justifyContent: "center", gap: "s16", paddingVertical: "s32" }}
      testID="pay-card-balance-funded-state"
    >
      <AmountDisplay
        value={balance}
        formatter={formatCountervalue}
        loading={isLoading}
        size="md"
        testID="pay-card-balance-amount"
      />
      <BalanceFilterSelect
        allStablecoinsLabel={allStablecoinsLabel}
        selectedOption={selectedOption}
        onOpenFilter={onOpenFilter}
      />
      <Box lx={{ marginTop: "s40", alignItems: "center", justifyContent: "center" }}>
        {actionTiles && <ActionTiles {...actionTiles} />}
      </Box>
    </Box>
  );
}
