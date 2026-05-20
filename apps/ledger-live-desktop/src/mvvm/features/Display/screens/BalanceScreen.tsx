import React from "react";
import { useDisplayFlowData } from "../context/DisplayFlowContext";

/**
 * Step 1 — Balance.
 *
 * Reads the formatted balance string from `uiConfig`. That string was produced
 * by the coin's `DisplayDescriptor` using the real `account.balance`, so the
 * UI has no idea which family is on screen.
 */
export function BalanceScreen() {
  const { uiConfig } = useDisplayFlowData();

  return (
    <div className="flex flex-col items-center gap-12 py-24">
      <span className="body-2 text-muted">Current balance</span>
      <span className="heading-1-semi-bold text-base">{uiConfig.balance}</span>
    </div>
  );
}
