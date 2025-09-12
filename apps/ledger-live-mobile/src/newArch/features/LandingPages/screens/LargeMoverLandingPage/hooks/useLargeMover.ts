import { useLargeMoverCurrencies } from "@ledgerhq/live-common/market/hooks/useLargeMoverCurrencies";
import { useCounterValueCurrency } from "~/hooks/useCounterValueCurrency";

export const useLargeMover = ({ currenciesIds }: { currenciesIds: string[] }) => {
  const counterValueCurrency = useCounterValueCurrency();

  const currencies = useLargeMoverCurrencies({
    ids: currenciesIds,
    counterCurrency: counterValueCurrency?.ticker || "USD",
  });

  const loading = currencies.some(currency => currency.isLoading);
  const isError = currencies.every(currency => currency.isError);

  return {
    currencies,
    loading,
    isError,
  };
};
