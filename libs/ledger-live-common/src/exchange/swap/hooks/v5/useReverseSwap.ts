import { getAccountCurrency } from "@ledgerhq/coin-framework/account/helpers";
import { useFetchCurrencyFrom } from "./useFetchCurrencyFrom";
import { AccountLike } from "@ledgerhq/types-live";

type Props = {
  accountTo?: AccountLike;
  additionalCoinsFlag?: boolean;
};

type Ret =
  | {
      reverse(): void;
      canReverse: true;
    }
  | {
      canReverse: false;
    };

export function useReverseSwap({ accountTo, additionalCoinsFlag }: Props): Ret {
  const currencyTo = accountTo ? getAccountCurrency(accountTo).id : undefined;
  const currenciesFrom = useFetchCurrencyFrom({
    currencyTo,
    additionalCoinsFlag,
    enabled: !!currencyTo,
  });

  if (!currenciesFrom.data) {
    return {
      canReverse: false,
    };
  }

  const isCurrencyFromInCurrencyToData = currenciesFrom.data.some(
    currencyFrom => currencyFrom.id === currencyTo,
  );

  if (!isCurrencyFromInCurrencyToData) {
    return {
      canReverse: false,
    };
  }

  return {
    canReverse: true,
    reverse: () =>
      console.log(
        '%cuseCanReverseSwap.ts line:40 "we are going to reverse now"',
        "color: #007acc;",
        "we are going to reverse now",
      ),
  };
}
