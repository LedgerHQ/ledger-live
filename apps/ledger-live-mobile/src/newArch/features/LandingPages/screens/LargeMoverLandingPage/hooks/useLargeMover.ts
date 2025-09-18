import { useLargeMoverCurrencies } from "@ledgerhq/live-common/market/hooks/useLargeMoverCurrencies";
import { useSelector } from "react-redux";
import { counterValueCurrencySelector } from "~/reducers/settings";

export const useLargeMover = ({ currenciesIds }: { currenciesIds: string[] }) => {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  const currencies = useLargeMoverCurrencies({
    ids: currenciesIds,
    counterCurrency: counterValueCurrency.ticker,
  });

  const loading = currencies.some(currency => currency.isLoading);
  const isError = currencies.every(currency => currency.isError);

  return {
    currencies,
    loading,
    isError,
  };
};
