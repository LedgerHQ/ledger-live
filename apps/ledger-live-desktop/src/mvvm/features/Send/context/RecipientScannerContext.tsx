import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

/**
 * RecipientScannerContext
 *
 * Desktop-only UI state for the recipient QR code scanner. The QR icon lives in the flow header
 * (SendHeader) while the panel replaces the recipient step body, so both need to read the same flag.
 */

type RecipientScannerContextValue = Readonly<{
  isScannerOpen: boolean;
  closeScanner: () => void;
  toggleScanner: () => void;
}>;

const RecipientScannerContext = createContext<RecipientScannerContextValue | null>(null);

type RecipientScannerProviderProps = Readonly<{
  children: ReactNode;
}>;

export function RecipientScannerProvider({ children }: RecipientScannerProviderProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const closeScanner = useCallback(() => setIsScannerOpen(false), []);
  const toggleScanner = useCallback(() => setIsScannerOpen(previous => !previous), []);

  const value = useMemo(
    () => ({ isScannerOpen, closeScanner, toggleScanner }),
    [isScannerOpen, closeScanner, toggleScanner],
  );

  return (
    <RecipientScannerContext.Provider value={value}>{children}</RecipientScannerContext.Provider>
  );
}

export function useRecipientScanner(): RecipientScannerContextValue {
  const context = useContext(RecipientScannerContext);
  if (!context) {
    throw new Error("useRecipientScanner must be used within a RecipientScannerProvider");
  }
  return context;
}
