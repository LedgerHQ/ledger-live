import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { flattenAccountsByCryptoCurrencyScreenSelector } from "~/reducers/accounts";
import { screen, track } from "~/analytics";
import { ScreenName } from "~/const";
import useNotifications from "~/logic/notifications";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { MarketNavigatorStackParamList } from "LLM/features/Market/Navigator";
import { removeStarredMarketCoins, addStarredMarketCoins } from "~/actions/market";
import { RANGES } from "../../utils";
import {
  useCurrencyChartData,
  useCurrencyData,
} from "@ledgerhq/live-common/market/v2/useMarketDataProvider";
import { useMarket } from "../../hooks/useMarket";

type NavigationProps = BaseComposite<
  StackNavigatorProps<MarketNavigatorStackParamList, ScreenName.MarketDetail>
>;

function useMarketDetailViewModel({ navigation, route }: NavigationProps) {
  const { params } = route;
  const { currencyId, resetSearchOnUmount } = params;
  const dispatch = useDispatch();
  const { triggerMarketPushNotificationModal } = useNotifications();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

  const { marketParams, starredMarketCoins, refresh } = useMarket();

  const isStarred = starredMarketCoins.includes(currencyId);

  const { counterCurrency = "usd", range = "24h" } = marketParams;

  const resCurrencyChartData = useCurrencyChartData({
    counterCurrency,
    id: currencyId,
    ranges: RANGES,
  });

  const { currencyDataByRanges } = useCurrencyData({
    counterCurrency,
    id: currencyId,
    ranges: RANGES,
  });

  const dataChart = useMemo(
    () => resCurrencyChartData?.[RANGES.indexOf(range)].data,
    [range, resCurrencyChartData],
  );
  const isLoadingDataChart = useMemo(
    () => resCurrencyChartData?.[RANGES.indexOf(range)].isLoading,
    [range, resCurrencyChartData],
  );

  const dataCurrency = useMemo(
    () => currencyDataByRanges?.[RANGES.indexOf(range)].data,
    [range, currencyDataByRanges],
  );

  const isLoadingData = useMemo(
    () => currencyDataByRanges?.[RANGES.indexOf(range)].isLoading,
    [range, currencyDataByRanges],
  );

  const { name, internalCurrency } = dataCurrency || {};

  useEffect(() => {
    if (name) {
      track("Page Market Coin", {
        currencyName: name,
        starred: isStarred,
        timeframe: range,
      });
    }
  }, [name, isStarred, range]);

  useEffect(() => {
    if (readOnlyModeEnabled) {
      screen("ReadOnly", "Market Coin");
    }
  }, [readOnlyModeEnabled]);

  useEffect(() => {
    const resetState = () => {
      // selectCurrency();
    };
    const sub = navigation.addListener("blur", resetState);
    return () => {
      sub();
    };
  }, [resetSearchOnUmount, navigation]);

  const allAccounts = useSelector(flattenAccountsByCryptoCurrencyScreenSelector(internalCurrency));

  const filteredAccounts = useMemo(
    () => allAccounts.sort((a, b) => b.balance.minus(a.balance).toNumber()).slice(0, 3),
    [allAccounts],
  );

  const defaultAccount = useMemo(
    () => (filteredAccounts && filteredAccounts.length === 1 ? filteredAccounts[0] : undefined),
    [filteredAccounts],
  );

  const toggleStar = useCallback(() => {
    const action = isStarred ? removeStarredMarketCoins : addStarredMarketCoins;
    dispatch(action(currencyId));

    if (!isStarred) triggerMarketPushNotificationModal();
  }, [dispatch, isStarred, currencyId, triggerMarketPushNotificationModal]);

  return {
    loading: isLoadingData,
    loadingChart: isLoadingDataChart,
    defaultAccount,
    isStarred,
    accounts: filteredAccounts,
    counterCurrency,
    allAccounts,
    currency: dataCurrency,
    dataChart,
    range,
    refresh,
    toggleStar,
  };
}

export default useMarketDetailViewModel;
