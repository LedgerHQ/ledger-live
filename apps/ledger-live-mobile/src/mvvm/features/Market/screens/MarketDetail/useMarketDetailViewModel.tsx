import { useCallback, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { accountsSelector } from "~/reducers/accounts";
import { screen, track } from "~/analytics";
import { ScreenName } from "~/const";
import { useNotifications } from "~/logic/notifications";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { MarketNavigatorStackParamList } from "LLM/features/Market/Navigator";

import { useMarket } from "LLM/features/Market/hooks/useMarket";
import { useMarketCoinDataWithChart } from "LLM/features/Market/hooks/useMarketCoinData";
import { addStarredMarketCoins, removeStarredMarketCoins } from "~/actions/settings";
import VersionNumber from "react-native-version-number";
import { selectCurrency } from "@ledgerhq/live-common/dada-client/utils/currencySelection";
import { assetsDataApi } from "@ledgerhq/live-common/dada-client/state-manager/api";
import { findCryptoCurrencyByKeyword } from "@ledgerhq/cryptoassets/currencies";

type NavigationProps = BaseComposite<
  StackNavigatorProps<MarketNavigatorStackParamList, ScreenName.MarketDetail>
>;

function useMarketDetailViewModel({ route }: NavigationProps) {
  const { params } = route;

  const currencyId = useMemo(() => {
    const currency = findCryptoCurrencyByKeyword(params.currencyId.toLowerCase());

    if (!currency) {
      return params.currencyId;
    }

    return currency.id;
  }, [params.currencyId]);

  const { marketParams, dataChart, loadingChart, loading, currency, refetch } =
    useMarketCoinDataWithChart({
      currencyId,
    });

  const { data, isLoading: isLoadingAsset } = assetsDataApi.useGetAssetDataQuery(
    {
      currencyIds: currency?.ledgerIds,
      product: "llm",
      version: VersionNumber.appVersion,
      isStaging: false,
      includeTestNetworks: false,
    },
    {
      skip: !currency?.ledgerIds?.length,
    },
  );

  const dispatch = useDispatch();
  const { tryTriggerPushNotificationDrawerAfterAction } = useNotifications();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

  const { starredMarketCoins, updateMarketParams } = useMarket();

  const isStarred = starredMarketCoins.includes(currencyId);

  const { counterCurrency = "usd", range = "24h" } = marketParams;

  const { name } = currency || {};

  const ledgerCurrency = data && selectCurrency(data);

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

  const allAccounts = useSelector(accountsSelector).filter(
    account => account.currency.id === currencyId,
  );

  const filteredAccounts = useMemo(
    () => allAccounts.sort((a, b) => b.balance.minus(a.balance).toNumber()).slice(0, 3),
    [allAccounts],
  );

  const defaultAccount = useMemo(
    () => (filteredAccounts && filteredAccounts.length === 1 ? filteredAccounts[0] : undefined),
    [filteredAccounts],
  );

  const toggleStar = useCallback(() => {
    const nextIsStarred = !isStarred;
    if (nextIsStarred) {
      dispatch(addStarredMarketCoins(currencyId));
      tryTriggerPushNotificationDrawerAfterAction("add_favorite_coin");
    }
    if (!nextIsStarred) {
      dispatch(removeStarredMarketCoins(currencyId));
    }
  }, [dispatch, isStarred, currencyId, tryTriggerPushNotificationDrawerAfterAction]);

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
    updateMarketParams,
    refetch,
    loading: loading || isLoadingAsset,
    toggleStar,
    ledgerCurrency,
  };
}

export default useMarketDetailViewModel;
