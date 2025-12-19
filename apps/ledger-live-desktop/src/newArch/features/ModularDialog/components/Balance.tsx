import React from "react";
import CounterValue from "~/renderer/components/CounterValue";
import FormattedVal from "~/renderer/components/FormattedVal";
import { BalanceUI } from "@ledgerhq/live-common/modularDrawer/utils/type";

export const balanceItem = (balanceUI: BalanceUI) => {
  const { currency, balance } = balanceUI;

  if (balance.isZero()) {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-4">
      <span className="body-2-semi-bold">
        <CounterValue currency={currency} value={balance} placeholder="-" color="inherit" />
      </span>
      <span className="text-muted body-3">
        <FormattedVal unit={currency.units[0]} val={balance} showCode color="inherit" />
      </span>
    </div>
  );
};
