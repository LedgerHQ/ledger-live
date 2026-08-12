import React from "react";
import { Divider } from "@ledgerhq/lumen-ui-react";
import type { PayCardBalanceViewProps } from "./types";
import { PayCardBalanceEmptyState } from "./PayCardBalanceEmptyState";
import { PayCardBalanceFundedState } from "./PayCardBalanceFundedState";

export function PayCardBalanceView(props: PayCardBalanceViewProps) {
  return (
    <div className="flex flex-col gap-24" data-testid="pay-card-balance">
      {props.displayMode === "funded" ? (
        <PayCardBalanceFundedState
          balance={props.balance}
          formatCountervalue={props.formatCountervalue}
          isLoading={props.isLoading}
        />
      ) : (
        <PayCardBalanceEmptyState labels={props.labels} />
      )}
      <Divider orientation="horizontal" />
    </div>
  );
}
