import { useMarketData } from "@ledgerhq/live-common/market/MarketDataProvider";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSupportedCounterValues } from "~/reducers/settings";
import { setMarketCounterCurrency } from "~/actions/settings";
import { useNavigation } from "@react-navigation/native";
import MarketCurrencySelect from "./MarketCurrencySelect";

function MarketCurrencySelectCont() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const supportedCountervalues = useSelector(getSupportedCounterValues);
  const { counterCurrency, supportedCounterCurrencies, setCounterCurrency } = useMarketData();

  const items = supportedCountervalues
    .filter(({ ticker }) => supportedCounterCurrencies.includes(ticker.toLowerCase()))
    .map(cur => ({
      value: cur.ticker.toLowerCase(),
      label: cur.label,
    }))
    .sort(a => (a.value === counterCurrency ? -1 : 0));

  const onSelectCurrency = useCallback(
    (value: string) => {
      dispatch(setMarketCounterCurrency(value));
      setCounterCurrency(value);
      navigation.goBack();
    },
    [dispatch, navigation, setCounterCurrency],
  );

  return (
    <MarketCurrencySelect
      items={items}
      onSelectCurrency={onSelectCurrency}
      counterCurrency={counterCurrency}
    />
  );
}

export default MarketCurrencySelectCont;
