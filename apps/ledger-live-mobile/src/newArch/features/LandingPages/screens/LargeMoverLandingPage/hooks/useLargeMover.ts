import { useState } from "react";
import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import { useLargeMoverDataProvider } from "@ledgerhq/live-common/market/hooks/useLargeMoverDataProvider";
import { useSelector } from "react-redux";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { getCurrencyIdsFromTickers } from "../utils";

type HookProps = {
  currencyIdsArray: string[];
  initialKeyRange?: KeysPriceChange;
};

export const useLargeMover = ({
  currencyIdsArray,
  initialKeyRange = KeysPriceChange.day,
}: HookProps) => {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const currenciesIds = getCurrencyIdsFromTickers(currencyIdsArray);
  const [range, setRange] = useState<KeysPriceChange>(initialKeyRange);
  const { currencies } = useLargeMoverDataProvider({
    ids: currenciesIds,
    counterCurrency: counterValueCurrency.ticker,
    range,
  });

  const loading = currencies.some(currencies => currencies.isLoading);
  const isError = currencies.every(currencies => currencies.isError);

  return {
    range,
    setRange,
    currencies,
    loading,
    isError,
  };
};
