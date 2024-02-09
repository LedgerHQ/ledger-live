import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSingleCoinMarketData } from "@ledgerhq/live-common/market/MarketDataProvider";
import { readOnlyModeEnabledSelector, starredMarketCoinsSelector } from "~/reducers/settings";
import { addStarredMarketCoins, removeStarredMarketCoins } from "~/actions/settings";
import { flattenAccountsByCryptoCurrencyScreenSelector } from "~/reducers/accounts";
import { screen, track } from "~/analytics";
import { ScreenName } from "~/const";
import useNotifications from "~/logic/notifications";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { MarketNavigatorStackParamList } from "LLM/features/Market/Navigator";
import MarketDetails from "./MarketDetail";

type NavigationProps = BaseComposite<
  StackNavigatorProps<MarketNavigatorStackParamList, ScreenName.MarketDetail>
>;

function MarketDetailCont({ navigation, route }: NavigationProps) {
  const { params } = route;
  const { currencyId, resetSearchOnUmount } = params;
  const dispatch = useDispatch();
  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);
  const isStarred = starredMarketCoins.includes(currencyId);
  const { triggerMarketPushNotificationModal } = useNotifications();
  const [hasRetried, setHasRetried] = useState<boolean>(false);

  const {
    selectedCoinData: currency,
    selectCurrency,
    chartRequestParams,
    loading,
    loadingChart,
    refreshChart,
    counterCurrency,
  } = useSingleCoinMarketData();

  const { name, internalCurrency } = currency || {};

  useEffect(() => {
    if (!loading) {
      if (currency === undefined && !hasRetried) {
        selectCurrency(currencyId);
        setHasRetried(true);
      } else if (currency && hasRetried) {
        setHasRetried(false);
      }
    }
  }, [currency, selectCurrency, currencyId, hasRetried, loading]);

  useEffect(() => {
    const resetState = () => {
      // selectCurrency();
    };
    const sub = navigation.addListener("blur", resetState);
    return () => {
      sub();
    };
  }, [selectCurrency, resetSearchOnUmount, navigation]);

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

  useEffect(() => {
    if (name) {
      track("Page Market Coin", {
        currencyName: name,
        starred: isStarred,
        timeframe: chartRequestParams.range,
      });
    }
  }, [name, isStarred, chartRequestParams.range]);

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

  useEffect(() => {
    if (readOnlyModeEnabled) {
      screen("ReadOnly", "Market Coin");
    }
  }, [readOnlyModeEnabled]);

  return (
    <MarketDetails
      refresh={refreshChart}
      loading={loading}
      loadingChart={loadingChart}
      toggleStar={toggleStar}
      chartRequestParams={chartRequestParams}
      defaultAccount={defaultAccount}
      currency={currency}
      isStarred={isStarred}
      accounts={filteredAccounts}
      counterCurrency={counterCurrency}
      allAccounts={allAccounts}
    />
  );
}

export default MarketDetailCont;
