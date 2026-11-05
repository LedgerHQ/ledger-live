import { useEffect, useState } from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import { QuotesErrorCodes } from "@ledgerhq/wallet-api-exchange-module";
import { SwapQuotesRequestFailed } from "../../../errors";
import { fetchPerpsDepositQuote, type PerpsDepositQuoteResult } from "./quote";

const QUOTE_DEBOUNCE_MS = 500;

export type UsePerpsDepositQuoteParams = {
  accounts: AccountLike[];
  depositAccount: AccountLike | undefined;
  receiverAccount: AccountLike;
  amount: string;
  isOffline: boolean;
  refreshGeneration: number;
  counterValueCurrency: string;
  locale: string;
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
function requestKeyOf({
  depositAccount,
  receiverAccount,
  amount,
  isOffline,
  refreshGeneration,
  counterValueCurrency,
}: UsePerpsDepositQuoteParams) {
  if (!depositAccount || !amount || isOffline) return null;
  return [
    depositAccount.id,
    receiverAccount.id,
    amount,
    counterValueCurrency,
    refreshGeneration,
  ].join("|");
}

/**
 * Debounced quote for the funding pair.
 */
export function usePerpsDepositQuote(params: UsePerpsDepositQuoteParams): PerpsDepositQuoteState {
  const { accounts, depositAccount, receiverAccount, amount, counterValueCurrency, locale } =
    params;
  const [current, setCurrent] = useState<{ key: string | null; state: PerpsDepositQuoteState }>({
    key: null,
    state: IDLE,
  });

  const requestKey = requestKeyOf(params);

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
        counterValueCurrency,
        locale,
      })
        .then(result => {
          if (!stale) setCurrent({ key: requestKey, state: { result, isLoading: false } });
        })
        .catch((error: unknown) => {
          if (!(error instanceof SwapQuotesRequestFailed)) {
            console.warn("[perps] deposit quote failed", error);
          }
          if (!stale) setCurrent({ key: requestKey, state: NO_QUOTES });
        });
    }, QUOTE_DEBOUNCE_MS);

    return () => {
      stale = true;
      clearTimeout(timeout);
    };
    // The key covers every input that changes the quote; account churn must not restart the request.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  // Effects run a render late, so the stale quote is dropped here instead.
  if (current.key !== requestKey) return requestKey === null ? IDLE : LOADING;
  return current.state;
}
