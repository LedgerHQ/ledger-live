import React from "react";
import { AmountDisplay } from "@ledgerhq/lumen-ui-react";
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
    <div className="flex items-end gap-12" data-testid="pay-card-balance-funded-state">
      <AmountDisplay
        value={balance}
        formatter={formatCountervalue}
        loading={isLoading}
        data-testid="pay-card-balance-amount"
      />
    </div>
  );
}
