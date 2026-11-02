import { useEffect, useState } from "react";
import { fetchPerpsWithdrawCurrencies } from "./currencies";

export type WithdrawCurrenciesState = {
  currencyIds: string[] | undefined;
  isError: boolean;
};

/** Ledger Wallet ids of the assets a perps balance can be withdrawn to. */
export function useWithdrawCurrencies(): WithdrawCurrenciesState {
  const [state, setState] = useState<WithdrawCurrenciesState>({
    currencyIds: undefined,
    isError: false,
  });

  useEffect(() => {
    let stale = false;
    fetchPerpsWithdrawCurrencies()
      .then(currencyIds => {
        if (!stale) setState({ currencyIds, isError: false });
      })
      .catch(() => {
        if (!stale) setState({ currencyIds: undefined, isError: true });
      });
    return () => {
      stale = true;
    };
  }, []);

  return state;
}
