import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

/**
 * Lets a family-specific recipient notice (SendRecipientNotice slot) block the
 * recipient step from being completed or advancing. Generic recipient code reads
 * `isFamilyRecipientBlocked` to gate completion and navigation, so the block stays
 * family-agnostic (e.g. Zcash shielded sync not ready — see families/bitcoin).
 */
type RecipientContinuationContextValue = Readonly<{
  isFamilyRecipientBlocked: boolean;
  setFamilyRecipientBlocked: (blocked: boolean) => void;
}>;

const RecipientContinuationContext = createContext<RecipientContinuationContextValue | null>(null);

type RecipientContinuationProviderProps = Readonly<{
  children: ReactNode;
}>;

export function RecipientContinuationProvider({ children }: RecipientContinuationProviderProps) {
  const [isFamilyRecipientBlocked, setIsFamilyRecipientBlocked] = useState(false);

  const setFamilyRecipientBlocked = useCallback(
    (blocked: boolean) => setIsFamilyRecipientBlocked(blocked),
    [],
  );

  const value = useMemo(
    () => ({ isFamilyRecipientBlocked, setFamilyRecipientBlocked }),
    [isFamilyRecipientBlocked, setFamilyRecipientBlocked],
  );

  return (
    <RecipientContinuationContext.Provider value={value}>
      {children}
    </RecipientContinuationContext.Provider>
  );
}

export function useRecipientContinuation(): RecipientContinuationContextValue {
  const context = useContext(RecipientContinuationContext);
  if (!context) {
    throw new Error("useRecipientContinuation must be used within a RecipientContinuationProvider");
  }
  return context;
}
