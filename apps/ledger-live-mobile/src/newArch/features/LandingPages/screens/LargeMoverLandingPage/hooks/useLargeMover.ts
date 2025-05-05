import { useState } from "react";
import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import { useLargeMoverDataProvider } from "@ledgerhq/live-common/market/hooks/useLargeMoverDataProvider";
import { useSelector } from "react-redux";
import { counterValueCurrencySelector } from "~/reducers/settings";

type HookProps = {
  currencyIds: string[];
  initialRange?: KeysPriceChange;
};

export const useLargeMover = ({ currencyIds, initialRange = KeysPriceChange.day }: HookProps) => {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const [range, setRange] = useState<KeysPriceChange>(initialRange);

  const {
    data: currencies,
    isLoading: loading,
    isError: error,
  } = useLargeMoverDataProvider({
    ids: currencyIds,
    counterCurrency: counterValueCurrency.ticker,
    range,
  });

  return {
    range,
    setRange,
    currencies,
    loading,
    error,
  };
};
