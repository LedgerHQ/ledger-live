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
  isUnavailable: boolean;
};

const IDLE: PerpsDepositQuoteState = { quote: undefined, isLoading: false, isUnavailable: false };
const LOADING: PerpsDepositQuoteState = { quote: undefined, isLoading: true, isUnavailable: false };
const UNAVAILABLE: PerpsDepositQuoteState = {
  quote: undefined,
  isLoading: false,
  isUnavailable: true,
};

/** What a quote was asked for, so it is never read back for anything else. */
function requestKeyOf(
  { depositAccount, receiverAccount, amount }: PerpsDepositQuoteParams,
  counterValueTicker: string,
) {
  if (!depositAccount || !amount) return null;
  return [depositAccount.id, receiverAccount.id, amount, counterValueTicker].join("|");
}

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
  const [current, setCurrent] = useState<{ key: string | null; state: PerpsDepositQuoteState }>({
    key: null,
    state: IDLE,
  });

  const requestKey = requestKeyOf(
    { depositAccount, receiverAccount, amount },
    counterValueCurrency.ticker,
  );

  useEffect(() => {
    if (!depositAccount || !amount) {
      setCurrent({ key: null, state: IDLE });
      return;
    }

    setCurrent({ key: requestKey, state: LOADING });

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
          if (stale) return;
          setCurrent({
            key: requestKey,
            state: received
              ? { quote: received, isLoading: false, isUnavailable: false }
              : UNAVAILABLE,
          });
        })
        .catch(() => {
          if (!stale) setCurrent({ key: requestKey, state: UNAVAILABLE });
        });
    }, QUOTE_DEBOUNCE_MS);

    return () => {
      stale = true;
      clearTimeout(timeout);
    };
  }, [accounts, amount, counterValueCurrency.ticker, depositAccount, receiverAccount, requestKey]);

  // Effects run a render late, so the stale quote is dropped here instead.
  if (current.key !== requestKey) return requestKey === null ? IDLE : LOADING;
  return current.state;
}
