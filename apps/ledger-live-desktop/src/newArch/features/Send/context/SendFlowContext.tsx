import React, { createContext, useContext, type ReactNode } from "react";
import type { SendFlowContextValue } from "../types";

const SendFlowContext = createContext<SendFlowContextValue | null>(null);

type SendFlowProviderProps = Readonly<{
  value: SendFlowContextValue;
  children: ReactNode;
}>;

export function SendFlowProvider({ value, children }: SendFlowProviderProps) {
  return <SendFlowContext.Provider value={value}>{children}</SendFlowContext.Provider>;
}

export function useSendFlowContext(): SendFlowContextValue {
  const context = useContext(SendFlowContext);
  if (!context) {
    throw new Error("useSendFlowContext must be used within a SendFlowProvider");
  }
  return context;
}
