import React, { createContext, useContext, type ReactNode } from "react";

const SendContactsFirstContext = createContext(false);

type SendContactsFirstProviderProps = Readonly<{
  enabled: boolean;
  children: ReactNode;
}>;

export function SendContactsFirstProvider({ enabled, children }: SendContactsFirstProviderProps) {
  return (
    <SendContactsFirstContext.Provider value={enabled}>
      {children}
    </SendContactsFirstContext.Provider>
  );
}

export function useSendContactsFirst(): boolean {
  return useContext(SendContactsFirstContext);
}
