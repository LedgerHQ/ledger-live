import React from "react";
import { AmountDisplay, Box } from "@ledgerhq/lumen-ui-rnative";
import type { FormattedValue } from "./types";

type PayCardBalanceFundedStateProps = Readonly<{
  balance: number;
  formatCountervalue: (value: number) => FormattedValue;
  isLoading: boolean;
}>;

export function PayCardBalanceFundedState({
  balance,
  formatCountervalue,
  isLoading,
}: PayCardBalanceFundedStateProps) {
  return (
    <Box
      lx={{ alignItems: "center", justifyContent: "center", paddingVertical: "s32" }}
      testID="pay-card-balance-funded-state"
    >
      <AmountDisplay
        value={balance}
        formatter={formatCountervalue}
        loading={isLoading}
        size="md"
        testID="pay-card-balance-amount"
      />
    </Box>
  );
}
