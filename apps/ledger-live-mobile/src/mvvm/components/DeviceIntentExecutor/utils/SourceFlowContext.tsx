import React from "react";

/**
 * Originating user intent that initiated the device flow — sticky across mid-flow
 * detours. Every DIE caller MUST pass the value through `DeviceIntentExecutorLWM`.
 */
export type SourceFlow =
  | "send"
  | "receive"
  | "swap"
  | "buy/sell"
  | "earn"
  | "add_account"
  | "my_ledger"
  | "wallet_connect"
  | "onboarding"
  | "debug";

const SourceFlowContext = React.createContext<SourceFlow | null>(null);

export const SourceFlowProvider = SourceFlowContext.Provider;

export function useSourceFlow(): SourceFlow {
  const value = React.useContext(SourceFlowContext);
  if (!value) {
    throw new Error("useSourceFlow must be used inside <SourceFlowProvider>");
  }
  return value;
}
