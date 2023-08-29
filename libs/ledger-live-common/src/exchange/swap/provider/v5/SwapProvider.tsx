import React, { PropsWithChildren, useCallback, useEffect, useState } from "react";

import { AccountLike } from "@ledgerhq/types-live";
import { useFetchCurrencyTo } from "../../hooks/v5/useFetchCurrecyTo";
import { SwapContext } from "../../context/v5/SwapContext";
import { useFetchCurrencyFrom } from "../../hooks/v5/useFetchCurrencyFrom";
import { useFetchRates } from "../../hooks/v5/useFetchRates";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account/index";
import { useDebounce } from "../../hooks/common/useDebounce";

type Props = {
  accountFrom?: AccountLike;
  accounts: AccountLike[];
  rateRefetchInterval?: number;
};

export function SwapProvider({
  children,
  accountFrom,
  accounts,
  rateRefetchInterval = 20000,
}: PropsWithChildren<Props>) {
  const [toCurrency, _setToCurrency] = useState<CryptoOrTokenCurrency | undefined>();
  const [toCurrencyAccount, setToCurrencyAccount] = useState<AccountLike | undefined>();
  const [fromCurrencyAccount, _setFromCurrencyAccount] = useState(accountFrom);
  const [fromCurrencyAmount, setFromCurrencyAmount] = useState(BigNumber(0));

  const debouncedFromCurrencyAccount = useDebounce(fromCurrencyAccount, 500);
  const debouncedToCurrency = useDebounce(toCurrency, 500);
  const debouncedFromCurrencyAmount = useDebounce(fromCurrencyAmount, 500);

  const toCurrencies = useFetchCurrencyTo({ fromCurrencyAccount: debouncedFromCurrencyAccount });
  const fromCurrencies = useFetchCurrencyFrom({});

  const { refetch: rateRefetch, ...rates } = useFetchRates({
    fromCurrencyAccount: debouncedFromCurrencyAccount,
    toCurrency: debouncedToCurrency,
    fromCurrencyAmount: debouncedFromCurrencyAmount,
  });

  const setToCurrency = useCallback(
    (newToCurrency: CryptoOrTokenCurrency | undefined) => {
      _setToCurrency(newToCurrency);
      const accountWithCurrency = accounts.find(account => {
        const currency = getAccountCurrency(account);
        return currency.id === newToCurrency?.id;
      });
      setToCurrencyAccount(accountWithCurrency);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [_setToCurrency, setToCurrencyAccount, JSON.stringify(accounts)],
  );

  const setFromCurrencyAccount = useCallback(
    (newFromCurrencyAccount: AccountLike | undefined) => {
      _setFromCurrencyAccount(newFromCurrencyAccount);
      setToCurrency(undefined);
      console.log(
        '%cSwapProvider.tsx line:60 "set to undefined"',
        "color: #007acc;",
        newFromCurrencyAccount,
      );
    },
    [_setFromCurrencyAccount, setToCurrency],
  );

  // Setup an interval on any rates we have.
  useEffect(() => {
    const interval = setInterval(() => {
      rateRefetch();
    }, rateRefetchInterval);
    return () => clearInterval(interval);
  }, [rateRefetch, rateRefetchInterval]);

  useEffect(() => {
    if (!toCurrency && toCurrencies.data && toCurrencies.data.length > 0) {
      // set the to currency to the first returned value
      // of the to currencies endpoint.
      console.log(
        '%cSwapProvider.tsx line:81 "setting toCurreny to", toCurrencies.data[0]',
        "color: #007acc;",
        "setting toCurreny to",
        toCurrencies.data[0],
      );
      setToCurrency(toCurrencies.data[0]);
    }
  }, [toCurrency, toCurrencies, setToCurrency]);

  return (
    <SwapContext.Provider
      value={{
        canReverse: false,
        fromCurrencies: fromCurrencies.data ?? [],
        fromCurrency: fromCurrencyAccount ? getAccountCurrency(fromCurrencyAccount) : undefined,
        fromCurrencyAccount,
        fromCurrencyAmount,
        rates: rates.data ?? [],
        setFromCurrencyAccount,
        setFromCurrencyAmount,
        setToCurrency,
        toCurrencies: toCurrencies.data ?? [],
        toCurrency,
        toCurrencyAccount,
      }}
    >
      {children}
    </SwapContext.Provider>
  );
}
