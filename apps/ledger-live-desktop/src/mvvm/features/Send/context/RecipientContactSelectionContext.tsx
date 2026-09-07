import type { Contact } from "@domain/entity-contact";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

type RecipientContactSelectionContextValue = Readonly<{
  selectedContact: Contact | undefined;
  selectContact: (contact: Contact) => void;
  clearSelectedContact: () => void;
}>;

const RecipientContactSelectionContext =
  createContext<RecipientContactSelectionContextValue | null>(null);

type RecipientContactSelectionProviderProps = Readonly<{
  children: ReactNode;
}>;

export function RecipientContactSelectionProvider({
  children,
}: RecipientContactSelectionProviderProps) {
  const [selectedContact, setSelectedContact] = useState<Contact>();

  const selectContact = useCallback((contact: Contact) => setSelectedContact(contact), []);
  const clearSelectedContact = useCallback(() => setSelectedContact(undefined), []);

  const value = useMemo(
    () => ({ selectedContact, selectContact, clearSelectedContact }),
    [clearSelectedContact, selectContact, selectedContact],
  );

  return (
    <RecipientContactSelectionContext.Provider value={value}>
      {children}
    </RecipientContactSelectionContext.Provider>
  );
}

export function useRecipientContactSelection(): RecipientContactSelectionContextValue {
  const context = useContext(RecipientContactSelectionContext);
  if (!context) {
    throw new Error(
      "useRecipientContactSelection must be used within a RecipientContactSelectionProvider",
    );
  }
  return context;
}
