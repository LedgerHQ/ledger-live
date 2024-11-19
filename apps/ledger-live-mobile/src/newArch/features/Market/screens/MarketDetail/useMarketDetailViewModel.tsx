import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { flattenAccountsByCryptoCurrencyScreenSelector } from "~/reducers/accounts";
import { screen, track } from "~/analytics";
import { ScreenName } from "~/const";
import useNotifications from "~/logic/notifications";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { MarketNavigatorStackParamList } from "LLM/features/Market/Navigator";

import { useMarket } from "LLM/features/Market/hooks/useMarket";
import { useMarketCoinData } from "LLM/features/Market/hooks/useMarketCoinData";
import { addStarredMarketCoins, removeStarredMarketCoins } from "~/actions/settings";

type NavigationProps = BaseComposite<
  StackNavigatorProps<MarketNavigatorStackParamList, ScreenName.MarketDetail>
>;

function useMarketDetailViewModel({ navigation, route }: NavigationProps) {
  const { params } = route;
  const { currencyId, resetSearchOnUmount } = params;

  const { marketParams, dataChart, loadingChart, loading, currency } = useMarketCoinData({
    currencyId,
  });

  const dispatch = useDispatch();
  const { triggerMarketPushNotificationModal } = useNotifications();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

  const { starredMarketCoins, refresh } = useMarket();

  const isStarred = starredMarketCoins.includes(currencyId);

  const { counterCurrency = "usd", range = "24h" } = marketParams;

  const { name, internalCurrency } = currency || {};

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
    defaultAccount,
    isStarred,
    accounts: filteredAccounts,
    counterCurrency,
    allAccounts,
    range,
    currency,
    dataChart,
    loadingChart,
    loading,
    refresh,
    toggleStar,
  };
}

export default useMarketDetailViewModel;
