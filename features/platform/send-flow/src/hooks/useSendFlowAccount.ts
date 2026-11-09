import type { SendAccount, SendAccountLike } from "../registry";
import { useCallback, useMemo, useReducer } from "react";
import { getAccountCurrency } from "../internals/account";
import type { SendFlowAccountState } from "../types";

type AccountAction =
  | { type: "SET_ACCOUNT"; account: SendAccountLike; parentAccount: SendAccount | null }
  | { type: "CLEAR" };

function accountReducer(state: SendFlowAccountState, action: AccountAction): SendFlowAccountState {
  switch (action.type) {
    case "SET_ACCOUNT":
      return {
        account: action.account,
        parentAccount: action.parentAccount,
        currency: getAccountCurrency(action.account),
      };
    case "CLEAR":
      return { account: null, parentAccount: null, currency: null };
    default:
      return state;
  }
}

function createInitialState(
  initialAccount?: SendAccountLike,
  initialParentAccount?: SendAccount | null,
): SendFlowAccountState {
  if (!initialAccount) {
    return { account: null, parentAccount: null, currency: null };
  }
  return {
    account: initialAccount,
    parentAccount: initialParentAccount ?? null,
    currency: getAccountCurrency(initialAccount),
  };
}

type UseSendFlowAccountParams = Readonly<{
  initialAccount?: SendAccountLike;
  initialParentAccount?: SendAccount | null;
}>;

type UseSendFlowAccountResult = Readonly<{
  state: SendFlowAccountState;
  setAccount: (account: SendAccountLike, parentAccount?: SendAccount | null) => void;
  clearAccount: () => void;
  hasAccount: boolean;
  currencyId: string | null;
}>;

export function useSendFlowAccount({
  initialAccount,
  initialParentAccount,
}: UseSendFlowAccountParams = {}): UseSendFlowAccountResult {
  const [state, dispatch] = useReducer(accountReducer, undefined, () =>
    createInitialState(initialAccount, initialParentAccount),
  );

  const setAccount = useCallback((account: SendAccountLike, parentAccount?: SendAccount | null) => {
    dispatch({ type: "SET_ACCOUNT", account, parentAccount: parentAccount ?? null });
  }, []);

  const clearAccount = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  return useMemo(
    () => ({
      state,
      setAccount,
      clearAccount,
      hasAccount: state.account !== null,
      currencyId: state.currency?.id ?? null,
    }),
    [state, setAccount, clearAccount],
  );
}
