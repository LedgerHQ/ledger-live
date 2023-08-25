import { AccountLike } from "@ledgerhq/types-live";
import { useFetchCurrencyFrom } from "../../hooks/v5/useFetchCurrencyFrom";
import { useFetchRates } from "../../hooks/v5/useFetchRates";
import { useFetchCurrencyTo } from "../../hooks/v5/useFetchCurrecyTo";
import { createContext } from "react";
import { useReverseSwap } from "../../hooks/v5/useReverseSwap";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";

type SwapContextType = {
  fromCurrencyAmount: BigNumber;
  setFromCurrencyAmount(newFromCurrencyAmount: BigNumber): void;
  fromCurrencies: ReturnType<typeof useFetchCurrencyFrom>["data"];
  fromCurrencyAccount: AccountLike | undefined;
  fromCurrency: CryptoOrTokenCurrency | undefined;
  rates: ReturnType<typeof useFetchRates>["data"];
  toCurrencies: ReturnType<typeof useFetchCurrencyTo>["data"];
  toCurrencyAccount: AccountLike | undefined;
  toCurrency: CryptoOrTokenCurrency | undefined;
  setToCurrency(newToCurrency: CryptoOrTokenCurrency | undefined): void;
} & ReturnType<typeof useReverseSwap>;

export const SwapContext = createContext<SwapContextType>({
  canReverse: false,
  fromCurrencyAmount: BigNumber(0),
  setFromCurrencyAmount: () => undefined,
  fromCurrencies: [],
  fromCurrencyAccount: undefined,
  fromCurrency: undefined,
  rates: [],
  toCurrencies: [],
  toCurrencyAccount: undefined,
  toCurrency: undefined,
  setToCurrency: () => undefined,
});
