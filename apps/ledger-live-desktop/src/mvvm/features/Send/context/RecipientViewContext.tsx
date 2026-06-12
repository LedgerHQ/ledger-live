import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

/**
 * Sub-view of the Recipient step (Figma 14437:40339 / 40767 / 43129):
 *  - "default":  address input + Contacts / My accounts previews (2 rows each).
 *  - "contacts": full alphabetical contact list with its own search input.
 *  - "accounts": full compatible-accounts list with its own search input.
 *
 * The mode is shared between `SendHeader` (which swaps to a back-arrow +
 * title header in the list modes and hides the address input) and
 * `RecipientScreen` (which renders the full-list body instead of the
 * address-validation modal) — hence a context rather than local state.
 */
export type RecipientViewMode = "default" | "contacts" | "accounts";

type RecipientViewValue = Readonly<{
  view: RecipientViewMode;
  setView: (view: RecipientViewMode) => void;
}>;

const RecipientViewContext = createContext<RecipientViewValue | null>(null);

type ProviderProps = Readonly<{
  /**
   * Any value change snaps the view back to "default" — the layout passes
   * the wizard's current step so leaving the Recipient step (forward to
   * Amount or back to account selection) never strands a full-list mode.
   */
  resetKey: string | number;
  children: ReactNode;
}>;

export function RecipientViewProvider({ resetKey, children }: ProviderProps) {
  const [view, setView] = useState<RecipientViewMode>("default");

  useEffect(() => {
    setView("default");
  }, [resetKey]);

  const value = useMemo(() => ({ view, setView }), [view]);

  return <RecipientViewContext.Provider value={value}>{children}</RecipientViewContext.Provider>;
}

export function useRecipientView(): RecipientViewValue {
  const context = useContext(RecipientViewContext);
  if (!context) {
    throw new Error("useRecipientView must be used within a RecipientViewProvider");
  }
  return context;
}
