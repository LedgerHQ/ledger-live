import { useEffect, useState } from "react";
import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import {
  fetchPerpsWithdrawQuote,
  type WithdrawQuote,
} from "@ledgerhq/live-common/wallet-api/Perps/withdraw/quote";

const QUOTE_DEBOUNCE_MS = 500;

export type PerpsWithdrawQuoteParams = {
  /** USDC amount, as typed. */
  amount: string;
  sourceAccount: AccountLike;
  destinationAccount: AccountLike | undefined;
  accounts: AccountLike[];
  counterValueCurrency: string;
};

export type PerpsWithdrawQuoteState = {
  quote: WithdrawQuote | undefined;
  isLoading: boolean;
  error: Error | null;
};

const IDLE: PerpsWithdrawQuoteState = { quote: undefined, isLoading: false, error: null };
const LOADING: PerpsWithdrawQuoteState = { quote: undefined, isLoading: true, error: null };

function requestKeyOf({
  amount,
  sourceAccount,
  destinationAccount,
  counterValueCurrency,
}: PerpsWithdrawQuoteParams) {
  if (!destinationAccount || !new BigNumber(amount).isGreaterThan(0)) return null;
  return [amount, sourceAccount.id, destinationAccount.id, counterValueCurrency].join("|");
}

/** Debounced swap quote, refreshed whenever the amount or destination changes. */
export function usePerpsWithdrawQuote(params: PerpsWithdrawQuoteParams): PerpsWithdrawQuoteState {
  const { amount, sourceAccount, destinationAccount, accounts, counterValueCurrency } = params;
  const requestKey = requestKeyOf(params);
  const [current, setCurrent] = useState<{ key: string | null; state: PerpsWithdrawQuoteState }>({
    key: null,
    state: IDLE,
  });

  useEffect(() => {
    if (requestKey === null || !destinationAccount) {
      setCurrent({ key: null, state: IDLE });
      return;
    }

    setCurrent({ key: requestKey, state: LOADING });

    let stale = false;
    const timeout = setTimeout(() => {
      fetchPerpsWithdrawQuote({
        accounts,
        sourceAccount,
        destinationAccount,
        amount,
        counterValueCurrency,
      })
        .then(quote => {
          if (!stale)
            setCurrent({ key: requestKey, state: { quote, isLoading: false, error: null } });
        })
        .catch((error: unknown) => {
          if (stale) return;
          setCurrent({
            key: requestKey,
            state: {
              quote: undefined,
              isLoading: false,
              error: error instanceof Error ? error : new Error(String(error)),
            },
          });
        });
    }, QUOTE_DEBOUNCE_MS);

    return () => {
      stale = true;
      clearTimeout(timeout);
    };
    // The key covers every input; account churn must not restart the request.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  // Effects run a render late, so a stale result is dropped here instead.
  if (current.key !== requestKey) return requestKey === null ? IDLE : LOADING;
  return current.state;
}
