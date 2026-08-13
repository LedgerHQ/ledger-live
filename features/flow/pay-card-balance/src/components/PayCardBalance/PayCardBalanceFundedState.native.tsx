import React from "react";
import { AmountDisplay, Box } from "@ledgerhq/lumen-ui-rnative";
import type { FormattedValue } from "./types";
import { ActionTiles } from "../ActionTiles";
import type { ActionTilesProps } from "../ActionTiles";

type PayCardBalanceFundedStateProps = Readonly<{
  balance: number;
  formatCountervalue: (value: number) => FormattedValue;
  isLoading: boolean;
  actionTiles?: ActionTilesProps;
}>;

export function PayCardBalanceFundedState({
  balance,
  formatCountervalue,
  isLoading,
  actionTiles,
}: PayCardBalanceFundedStateProps) {
  return (
    <Box lx={{ paddingVertical: "s32", gap: "s16" }} testID="pay-card-balance-funded-state">
      <Box lx={{ alignItems: "center", justifyContent: "center" }}>
        <AmountDisplay
          value={balance}
          formatter={formatCountervalue}
          loading={isLoading}
          size="md"
          testID="pay-card-balance-amount"
        />
      </Box>
      {actionTiles && <ActionTiles {...actionTiles} />}
    </Box>
  );
}
