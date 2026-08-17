import { useEffect, useState } from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import {
  fetchPerpsDepositQuote,
  type PerpsDepositQuote,
} from "@ledgerhq/live-common/wallet-api/Perps/depositQuote";
import { useSelector } from "LLD/hooks/redux";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";

const QUOTE_DEBOUNCE_MS = 500;

type PerpsDepositQuoteParams = {
  depositAccount: AccountLike | undefined;
  receiverAccount: AccountLike;
  amount: string;
};

/** Debounced quote for the funding pair. `undefined` until one lands. */
export function usePerpsDepositQuote({
  depositAccount,
  receiverAccount,
  amount,
}: PerpsDepositQuoteParams): PerpsDepositQuote | undefined {
  const accounts = useSelector(flattenAccountsSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const [quote, setQuote] = useState<PerpsDepositQuote>();

  useEffect(() => {
    setQuote(undefined);
    if (!depositAccount || !amount) return;

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
          if (!stale) setQuote(received);
        })
        .catch(() => undefined);
    }, QUOTE_DEBOUNCE_MS);

    return () => {
      stale = true;
      clearTimeout(timeout);
    };
  }, [accounts, amount, counterValueCurrency.ticker, depositAccount, receiverAccount]);

  return quote;
}
