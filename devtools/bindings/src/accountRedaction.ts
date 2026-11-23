import { createContext, useContext } from "react";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";

/** Hides what a displayed account must not show (Aleo: its view key); the host app knows the families. */
export type AccountRedaction = {
  readonly descriptor: (descriptor: AccountDescriptor) => AccountDescriptor;
  readonly accountId: (accountId: string) => string;
};

const AccountRedactionContext = createContext<AccountRedaction>({
  descriptor: descriptor => descriptor,
  accountId: accountId => accountId,
});

export const AccountRedactionProvider = AccountRedactionContext.Provider;

export const useAccountRedaction = (): AccountRedaction => useContext(AccountRedactionContext);
