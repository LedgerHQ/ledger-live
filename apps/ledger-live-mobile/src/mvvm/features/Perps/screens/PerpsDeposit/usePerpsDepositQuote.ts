import { useEffect, useState } from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import {
  fetchPerpsDepositQuote,
  type PerpsDepositQuote,
} from "@ledgerhq/live-common/wallet-api/Perps/depositQuote";
import { useSelector } from "~/context/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { counterValueCurrencySelector } from "~/reducers/settings";

const QUOTE_DEBOUNCE_MS = 500;

type PerpsDepositQuoteParams = {
  depositAccount: AccountLike | undefined;
  receiverAccount: AccountLike;
  amount: string;
};

export type PerpsDepositQuoteState = {
  quote: PerpsDepositQuote | undefined;
  isLoading: boolean;
};

const IDLE: PerpsDepositQuoteState = { quote: undefined, isLoading: false };

/**
 * Debounced quote for the funding pair.
 */
export function usePerpsDepositQuote({
  depositAccount,
  receiverAccount,
  amount,
}: PerpsDepositQuoteParams): PerpsDepositQuoteState {
  const accounts = useSelector(flattenAccountsSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const [state, setState] = useState<PerpsDepositQuoteState>(IDLE);

  useEffect(() => {
    if (!depositAccount || !amount) {
      setState(IDLE);
      return;
    }

    setState({ quote: undefined, isLoading: true });

    let stale = false;
    const timeout = setTimeout(() => {
      fetchPerpsDepositQuote({
        accounts,
        depositAccount,
        receiverAccount,
        amount,
        counterValueCurrency: counterValueCurrency.ticker,
      })
        .then(received => {
          if (!stale) setState({ quote: received, isLoading: false });
        })
        .catch(() => {
          if (!stale) setState(IDLE);
        });
    }, QUOTE_DEBOUNCE_MS);

    return () => {
      stale = true;
      clearTimeout(timeout);
    };
  }, [accounts, amount, counterValueCurrency.ticker, depositAccount, receiverAccount]);

  return state;
}
