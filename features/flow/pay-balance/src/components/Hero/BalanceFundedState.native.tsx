import React from "react";
import { AmountDisplay, Box } from "@ledgerhq/lumen-ui-rnative";
import type { FormattedValue, BalanceFilterOption } from "../../types";
import { BalanceFilterSelect } from "../Filter/BalanceFilterSelect.native";

type BalanceFundedStateProps = Readonly<{
  balance: number;
  formatCountervalue: (value: number) => FormattedValue;
  isLoading: boolean;
  allStablecoinsLabel: string;
  selectedOption?: BalanceFilterOption;
  onOpenFilter: () => void;
}>;

export function BalanceFundedState({
  balance,
  formatCountervalue,
  isLoading,
  allStablecoinsLabel,
  selectedOption,
  onOpenFilter,
}: BalanceFundedStateProps) {
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
    </Box>
  );
}
