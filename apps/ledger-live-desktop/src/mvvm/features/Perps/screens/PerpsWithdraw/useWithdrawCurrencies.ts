import { useEffect, useState } from "react";
import { fetchWithdrawCurrencies } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/api";
import { toLedgerCurrencyId } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/currencyMapping";

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
    fetchWithdrawCurrencies()
      .then(({ currencies }) => {
        if (!stale) {
          setState({
            currencyIds: currencies.map(({ id }) => toLedgerCurrencyId(id)),
            isError: false,
          });
        }
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
