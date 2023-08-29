import { AccountLike } from "@ledgerhq/types-live";
import { useFetchCurrencyFrom } from "../../hooks/v5/useFetchCurrencyFrom";
import { useFetchRates } from "../../hooks/v5/useFetchRates";
import { useFetchCurrencyTo } from "../../hooks/v5/useFetchCurrecyTo";
import { createContext } from "react";
import { useReverseSwap } from "../../hooks/v5/useReverseSwap";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";

type SwapContextType = {
  fromCurrencies: ReturnType<typeof useFetchCurrencyFrom>["data"];
  fromCurrency: CryptoOrTokenCurrency | undefined;
  fromCurrencyAccount: AccountLike | undefined;
  fromCurrencyAmount: BigNumber;
  rates: ReturnType<typeof useFetchRates>["data"];
  setFromCurrencyAccount(newFromCurrencyAccount: AccountLike): void;
  setFromCurrencyAmount(newFromCurrencyAmount: BigNumber): void;
  setToCurrency(newToCurrency: CryptoOrTokenCurrency | undefined): void;
  toCurrencies: ReturnType<typeof useFetchCurrencyTo>["data"];
  toCurrency: CryptoOrTokenCurrency | undefined;
  toCurrencyAccount: AccountLike | undefined;
} & ReturnType<typeof useReverseSwap>;

export const SwapContext = createContext<SwapContextType>({
  canReverse: false,
  fromCurrencies: [],
  fromCurrency: undefined,
  fromCurrencyAccount: undefined,
  fromCurrencyAmount: BigNumber(0),
  rates: [],
  setFromCurrencyAccount: () => undefined,
  setFromCurrencyAmount: () => undefined,
  setToCurrency: () => undefined,
  toCurrencies: [],
  toCurrency: undefined,
  toCurrencyAccount: undefined,
});
