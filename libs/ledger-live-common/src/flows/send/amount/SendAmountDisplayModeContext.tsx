import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

export type SendAmountDisplayMode = "fiat" | "crypto";

type SendAmountDisplayModeContextValue = Readonly<{
  displayMode: SendAmountDisplayMode;
  setDisplayMode: Dispatch<SetStateAction<SendAmountDisplayMode>>;
}>;

const SendAmountDisplayModeContext = createContext<SendAmountDisplayModeContextValue | null>(null);

type SendAmountDisplayModeProviderProps = Readonly<{
  children: ReactNode;
}>;

export function SendAmountDisplayModeProvider({ children }: SendAmountDisplayModeProviderProps) {
  const [displayMode, setDisplayMode] = useState<SendAmountDisplayMode>("fiat");

  const value = useMemo(
    () => ({
      displayMode,
      setDisplayMode,
    }),
    [displayMode],
  );

  return (
    <SendAmountDisplayModeContext.Provider value={value}>
      {children}
    </SendAmountDisplayModeContext.Provider>
  );
}

export function useSendAmountDisplayMode(): SendAmountDisplayModeContextValue {
  const context = useContext(SendAmountDisplayModeContext);
  if (!context) {
    throw new Error("useSendAmountDisplayMode must be used within a SendAmountDisplayModeProvider");
  }
  return context;
}
