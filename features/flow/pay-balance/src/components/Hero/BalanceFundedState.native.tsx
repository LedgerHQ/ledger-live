import React from "react";
import { AmountDisplay, Box, Pressable } from "@ledgerhq/lumen-ui-rnative";
import { Eye } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { FormattedValue, BalanceFilterOption } from "../../types";
import { BalanceFilterSelect } from "../Filter/BalanceFilterSelect.native";

type BalanceFundedStateProps = Readonly<{
  balance: number;
  formatCountervalue: (value: number) => FormattedValue;
  isLoading: boolean;
  allStablecoinsLabel: string;
  selectedOption?: BalanceFilterOption;
  onOpenFilter: () => void;
  discreet?: boolean;
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
  onToggleDiscreetMode,
}: BalanceFundedStateProps) {
  return (
    <Box
      lx={{ alignItems: "center", justifyContent: "center", gap: "s16" }}
      testID="pay-card-balance-funded-state"
    >
      <Pressable onPress={onToggleDiscreetMode} testID="pay-card-balance-toggle">
        <Box lx={{ flexDirection: "row", alignItems: "baseline", gap: "s14" }}>
          <AmountDisplay
            value={balance}
            formatter={formatCountervalue}
            loading={isLoading}
            hidden={discreet}
            size="md"
            testID="pay-card-balance-amount"
          />
          {discreet ? <Eye size={20} color="base" /> : null}
        </Box>
      </Pressable>
      <BalanceFilterSelect
        allStablecoinsLabel={allStablecoinsLabel}
        selectedOption={selectedOption}
        onOpenFilter={onOpenFilter}
      />
    </Box>
  );
}
