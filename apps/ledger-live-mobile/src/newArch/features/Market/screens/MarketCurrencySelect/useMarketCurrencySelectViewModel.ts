import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { supportedCounterValuesSelector } from "~/reducers/settings";
import { useNavigation } from "@react-navigation/native";
import { useMarket } from "../../hooks/useMarket";
import { setMarketRequestParams } from "~/actions/market";

function useMarketCurrencySelectViewModel() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const supportedCountervalues = useSelector(supportedCounterValuesSelector);

  const { supportedCounterCurrencies, marketParams } = useMarket();
  const { counterCurrency } = marketParams;

  const items = supportedCountervalues
    .filter(({ ticker }) => supportedCounterCurrencies?.includes(ticker.toLowerCase()))
    .map(cur => ({
      value: cur.ticker.toLowerCase(),
      label: cur.label,
    }))
    .sort(a => (a.value === counterCurrency ? -1 : 0));

  const onSelectCurrency = useCallback(
    (counterCurrency: string) => {
      dispatch(setMarketRequestParams({ counterCurrency }));
      navigation.goBack();
    },
    [dispatch, navigation],
  );

  return {
    items,
    onSelectCurrency,
    counterCurrency,
  };
}

export default useMarketCurrencySelectViewModel;
