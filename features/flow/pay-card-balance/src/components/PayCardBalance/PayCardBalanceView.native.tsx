import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { PayCardBalanceViewProps } from "./types";
import { PayCardBalanceEmptyState } from "./PayCardBalanceEmptyState";
import { PayCardBalanceFundedState } from "./PayCardBalanceFundedState";

export function PayCardBalanceView(props: PayCardBalanceViewProps) {
  return (
    <Box lx={{ paddingHorizontal: "s16" }} testID="pay-card-balance">
      {props.displayMode === "funded" ? (
        <PayCardBalanceFundedState
          balance={props.balance}
          formatCountervalue={props.formatCountervalue}
          isLoading={props.isLoading}
          actionTiles={props.actionTiles}
        />
      ) : (
        <PayCardBalanceEmptyState labels={props.labels} />
      )}
    </Box>
  );
}
