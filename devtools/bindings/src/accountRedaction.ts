import { createContext, useContext } from "react";

/** Hides what a displayed legacy account id must not show (Aleo: its view key); the host app knows the families. */
export type AccountRedaction = {
  readonly accountId: (accountId: string) => string;
};

const AccountRedactionContext = createContext<AccountRedaction>({
  accountId: accountId => accountId,
});

export const AccountRedactionProvider = AccountRedactionContext.Provider;

export const useAccountRedaction = (): AccountRedaction => useContext(AccountRedactionContext);
