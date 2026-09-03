import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

type RecipientInputFocusDecision = "pending" | "focus" | "skip";

type RecipientInputFocusContextValue = Readonly<{
  /** Whether the address input should take the keyboard. Turns true at most once, never back. */
  shouldFocusRecipientInput: boolean;
  /** Whether the recipient step already made its call. */
  isRecipientInputFocusSettled: boolean;
  /** Records the decision of the recipient step. Only the first call is taken into account. */
  settleRecipientInputFocus: (shouldFocus: boolean) => void;
}>;

const RecipientInputFocusContext = createContext<RecipientInputFocusContextValue | null>(null);

type RecipientInputFocusProviderProps = Readonly<{
  children: ReactNode;
}>;

/**
 * Bridges the recipient step, which knows when its content settled, and the send header, which
 * owns the address input.
 */
export function RecipientInputFocusProvider({ children }: RecipientInputFocusProviderProps) {
  const [decision, setDecision] = useState<RecipientInputFocusDecision>("pending");

  const settleRecipientInputFocus = useCallback((shouldFocus: boolean) => {
    setDecision(current => {
      if (current !== "pending") {
        return current;
      }
      return shouldFocus ? "focus" : "skip";
    });
  }, []);

  const value = useMemo(
    () => ({
      shouldFocusRecipientInput: decision === "focus",
      isRecipientInputFocusSettled: decision !== "pending",
      settleRecipientInputFocus,
    }),
    [decision, settleRecipientInputFocus],
  );

  return (
    <RecipientInputFocusContext.Provider value={value}>
      {children}
    </RecipientInputFocusContext.Provider>
  );
}

export function useRecipientInputFocus(): RecipientInputFocusContextValue {
  const context = useContext(RecipientInputFocusContext);
  if (!context) {
    throw new Error("useRecipientInputFocus must be used within a RecipientInputFocusProvider");
  }
  return context;
}
