import React, { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type AddNewContactHeaderState = Readonly<{
  titleKey: string;
  onAddressPhaseBack: (() => void) | null;
}>;

export const DEFAULT_ADD_NEW_CONTACT_HEADER_STATE: AddNewContactHeaderState = {
  titleKey: "contacts.addContact",
  onAddressPhaseBack: null,
};

type AddNewContactHeaderContextValue = Readonly<{
  state: AddNewContactHeaderState;
  setState: (state: AddNewContactHeaderState) => void;
}>;

const AddNewContactHeaderContext = createContext<AddNewContactHeaderContextValue | null>(null);

type AddNewContactHeaderProviderProps = Readonly<{
  children: ReactNode;
}>;

export function AddNewContactHeaderProvider({ children }: AddNewContactHeaderProviderProps) {
  const [state, setState] = useState<AddNewContactHeaderState>(
    DEFAULT_ADD_NEW_CONTACT_HEADER_STATE,
  );
  const value = useMemo(() => ({ state, setState }), [state]);

  return (
    <AddNewContactHeaderContext.Provider value={value}>
      {children}
    </AddNewContactHeaderContext.Provider>
  );
}

export function useAddNewContactHeaderState(): AddNewContactHeaderState {
  return useContext(AddNewContactHeaderContext)?.state ?? DEFAULT_ADD_NEW_CONTACT_HEADER_STATE;
}

export function useAddNewContactHeaderController() {
  const context = useContext(AddNewContactHeaderContext);
  if (!context) {
    throw new Error(
      "useAddNewContactHeaderController must be used within AddNewContactHeaderProvider",
    );
  }
  return context;
}
