import React, { PropsWithChildren, useEffect, useState } from "react";

import { AccountLike } from "@ledgerhq/types-live";
import { useFetchCurrencyTo } from "../../hooks/v5/useFetchCurrecyTo";
import { SwapContext } from "../../context/v5/SwapContext";
import { useFetchCurrencyFrom } from "../../hooks/v5/useFetchCurrencyFrom";
import { useFetchRates } from "../../hooks/v5/useFetchRates";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { useDebounce } from "../../hooks/common/useDebounce";

type Props = {
  accountFrom?: AccountLike;
  accounts: AccountLike[];
  rateRefetchInterval?: number;
};

export function SwapProvider({
  children,
  accountFrom,
  rateRefetchInterval = 20000,
}: PropsWithChildren<Props>) {
  const [toCurrency, setToCurrency] = useState<CryptoOrTokenCurrency | undefined>();
  const [fromCurrencyAmount, setFromCurrencyAmount] = useState(BigNumber(0));

  // get a debounced state so rates won't be immediately called on change.
  const debouncedFromCurrencyAmount = useDebounce(fromCurrencyAmount, 500);

  const toCurrencies = useFetchCurrencyTo({ accountFrom });
  const fromCurrencies = useFetchCurrencyFrom({});

  const { refetch: rateRefetch, ...rates } = useFetchRates({
    accountFrom,
    toCurrency,
    fromCurrencyAmount: debouncedFromCurrencyAmount,
  });

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
      setToCurrency(toCurrencies.data[0]);
    }
  }, [toCurrencies, toCurrency]);

  return (
    <SwapContext.Provider
      value={{
        canReverse: false,
        fromCurrencies: fromCurrencies.data ?? [],
        fromCurrency: undefined,
        fromCurrencyAccount: accountFrom,
        fromCurrencyAmount,
        rates: rates.data ?? [],
        setFromCurrencyAmount,
        setToCurrency,
        toCurrencies: toCurrencies.data ?? [],
        toCurrency,
        toCurrencyAccount: undefined,
      }}
    >
      {children}
    </SwapContext.Provider>
  );
}
