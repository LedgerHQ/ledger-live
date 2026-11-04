import { useEffect, useState } from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import { QuotesErrorCodes } from "@ledgerhq/live-common/wallet-api/Exchange/quotes/types";
import {
  fetchPerpsDepositQuote,
  type PerpsDepositQuoteResult,
} from "@ledgerhq/live-common/wallet-api/Perps/deposit/quote";
import { useSelector } from "~/context/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { counterValueCurrencySelector, localeSelector } from "~/reducers/settings";

const QUOTE_DEBOUNCE_MS = 500;

type PerpsDepositQuoteParams = {
  depositAccount: AccountLike | undefined;
  receiverAccount: AccountLike;
  amount: string;
  isOffline: boolean;
  refreshGeneration: number;
};

export type PerpsDepositQuoteState = {
  result: PerpsDepositQuoteResult | undefined;
  isLoading: boolean;
};

const IDLE: PerpsDepositQuoteState = { result: undefined, isLoading: false };
const LOADING: PerpsDepositQuoteState = { result: undefined, isLoading: true };
const NO_QUOTES: PerpsDepositQuoteState = {
  result: { errors: [{ code: QuotesErrorCodes.NO_QUOTES }] },
  isLoading: false,
};

/** What a quote was asked for, so it is never read back for anything else. */
function requestKeyOf(
  {
    depositAccount,
    receiverAccount,
    amount,
    isOffline,
    refreshGeneration,
  }: PerpsDepositQuoteParams,
  counterValueTicker: string,
) {
  if (!depositAccount || !amount || isOffline) return null;
  return [
    depositAccount.id,
    receiverAccount.id,
    amount,
    counterValueTicker,
    refreshGeneration,
  ].join("|");
}

/**
 * Debounced quote for the funding pair.
 */
export function usePerpsDepositQuote({
  depositAccount,
  receiverAccount,
  amount,
  isOffline,
  refreshGeneration,
}: PerpsDepositQuoteParams): PerpsDepositQuoteState {
  const accounts = useSelector(flattenAccountsSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const [current, setCurrent] = useState<{ key: string | null; state: PerpsDepositQuoteState }>({
    key: null,
    state: IDLE,
  });

  const requestKey = requestKeyOf(
    { depositAccount, receiverAccount, amount, isOffline, refreshGeneration },
    counterValueCurrency.ticker,
  );

  useEffect(() => {
    if (!requestKey || !depositAccount) {
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
        locale,
      })
        .then(result => {
          if (!stale) setCurrent({ key: requestKey, state: { result, isLoading: false } });
        })
        .catch(() => {
          if (!stale) setCurrent({ key: requestKey, state: NO_QUOTES });
        });
    }, QUOTE_DEBOUNCE_MS);

    return () => {
      stale = true;
      clearTimeout(timeout);
    };
    // The key covers every input; account churn must not restart the request.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  // Effects run a render late, so the stale quote is dropped here instead.
  if (current.key !== requestKey) return requestKey === null ? IDLE : LOADING;
  return current.state;
}
