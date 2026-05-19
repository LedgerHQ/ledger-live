import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";

export type SwapDefaultAccountsState = {
  defaultAccount?: AccountLike;
  defaultParentAccount?: Account;
  defaultAccountId?: string | { fromAccountId?: string; toAccountId?: string };
  defaultParentAccountId?: string;
} | null;

export type SwapDefaultAccounts = {
  rawFromAccountId: string | undefined;
  rawToAccountId: string | undefined;
  resolvedDefaultFromAccount: AccountLike | undefined;
  resolvedDefaultFromParentAccount: Account | undefined;
  resolvedDefaultToAccount: AccountLike | undefined;
  resolvedDefaultToParentAccount: Account | undefined;
};

const findParentAccount = (
  accounts: AccountLike[],
  child: AccountLike | undefined,
): Account | undefined => {
  if (child?.type !== "TokenAccount") return undefined;
  const candidate = accounts.find(acc => acc.id === child.parentId);
  return candidate?.type === "Account" ? candidate : undefined;
};

export const useSwapDefaultAccounts = (state: SwapDefaultAccountsState): SwapDefaultAccounts => {
  const accounts = useSelector(flattenAccountsSelector);

  const rawFromAccountId =
    typeof state?.defaultAccountId === "object"
      ? state?.defaultAccountId?.fromAccountId
      : undefined;

  const rawToAccountId =
    typeof state?.defaultAccountId === "string"
      ? state.defaultAccountId
      : state?.defaultAccountId?.toAccountId;

  const resolvedDefaultToAccount = useMemo(() => {
    if (state?.defaultAccount) return state.defaultAccount;
    return rawToAccountId ? accounts.find(acc => acc.id === rawToAccountId) : undefined;
  }, [accounts, state?.defaultAccount, rawToAccountId]);

  const resolvedDefaultFromAccount = useMemo(
    () => (rawFromAccountId ? accounts.find(acc => acc.id === rawFromAccountId) : undefined),
    [accounts, rawFromAccountId],
  );

  const resolvedDefaultToParentAccount = useMemo(() => {
    if (state?.defaultParentAccount) return state.defaultParentAccount;
    if (state?.defaultParentAccountId) {
      const candidate = accounts.find(acc => acc.id === state.defaultParentAccountId);
      return candidate?.type === "Account" ? candidate : undefined;
    }
    return findParentAccount(accounts, resolvedDefaultToAccount);
  }, [
    accounts,
    state?.defaultParentAccount,
    state?.defaultParentAccountId,
    resolvedDefaultToAccount,
  ]);

  const resolvedDefaultFromParentAccount = useMemo(
    () => findParentAccount(accounts, resolvedDefaultFromAccount),
    [accounts, resolvedDefaultFromAccount],
  );

  return {
    rawFromAccountId,
    rawToAccountId,
    resolvedDefaultFromAccount,
    resolvedDefaultFromParentAccount,
    resolvedDefaultToAccount,
    resolvedDefaultToParentAccount,
  };
};
