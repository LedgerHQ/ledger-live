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
  isFiatModeAvailable: boolean;
}>;

const SendAmountDisplayModeContext = createContext<SendAmountDisplayModeContextValue | null>(null);

type SendAmountDisplayModeProviderProps = Readonly<{
  children: ReactNode;
  isFiatModeAvailable?: boolean;
}>;

export function SendAmountDisplayModeProvider({
  children,
  isFiatModeAvailable = true,
}: SendAmountDisplayModeProviderProps) {
  const [selectedDisplayMode, setDisplayMode] = useState<SendAmountDisplayMode>("fiat");
  const displayMode = isFiatModeAvailable ? selectedDisplayMode : "crypto";

  const value = useMemo(
    () => ({
      displayMode,
      setDisplayMode,
      isFiatModeAvailable,
    }),
    [displayMode, isFiatModeAvailable],
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
