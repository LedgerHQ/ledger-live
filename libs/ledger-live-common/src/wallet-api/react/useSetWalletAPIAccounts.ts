import { useEffect } from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import { setWalletApiIdForAccountId } from "../converters";

export function useSetWalletAPIAccounts(accounts: AccountLike[]): void {
  useEffect(() => {
    accounts.forEach(account => {
      setWalletApiIdForAccountId(account.id);
    });
  }, [accounts]);
}
