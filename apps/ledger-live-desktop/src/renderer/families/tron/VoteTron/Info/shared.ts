import React, { useContext } from "react";
import { Account, AccountLike } from "@ledgerhq/types-live";
export type Props = {
  name?: string;
  account: AccountLike;
  parentAccount: Account | undefined | null;
};
const AccountContext = React.createContext<Props | undefined | null>();
export const AccountProvider = AccountContext.Provider;
export function useAccount() {
  return useContext(AccountContext);
}
