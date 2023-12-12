import React, { useCallback, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { MarketNavigatorStackParamList } from "LLM/features/Market/Navigator";
import { ScreenName } from "~/const";
import { useRoute } from "@react-navigation/native";
import {
  marketFilterByStarredAccountsSelector,
  starredMarketCoinsSelector,
} from "~/reducers/settings";
import { useMarketData } from "@ledgerhq/live-common/market/MarketDataProvider";
import MarketList from "./MarketList";

type NavigationProps = BaseComposite<
  StackNavigatorProps<MarketNavigatorStackParamList, ScreenName.MarketList>
>;

function MarketListCont() {
  const { params } = useRoute<NavigationProps["route"]>();
  const [isLoading, setIsLoading] = useState(true);
  const initialTop100 = params?.top100;
  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);
  const filterByStarredAccount: boolean = useSelector(marketFilterByStarredAccountsSelector);

  const {
    requestParams,
    refresh,
    counterCurrency,
    marketData,
    loadNextPage,
    loading,
    page,
    selectCurrency,
  } = useMarketData();

  const { limit, search, range, top100 } = requestParams;

  const marketDataFiltered = filterByStarredAccount
    ? marketData?.filter(d => starredMarketCoins.includes(d.id)) ?? undefined
    : marketData;

  useEffect(() => {
    if (initialTop100) {
      refresh({
        limit: 100,
        ids: [],
        starred: [],
        orderBy: "market_cap",
        order: "desc",
        search: "",
        liveCompatible: false,
        sparkline: false,
        top100: true,
      });
    }
  }, [initialTop100, refresh]);

  const onEndReached = useCallback(() => {
    if (
      !limit ||
      isNaN(limit) ||
      !marketData ||
      page * limit > marketData.length ||
      loading ||
      top100
    ) {
      setIsLoading(false);
      return Promise.resolve();
    }
    setIsLoading(true);
    const next = loadNextPage();
    return next
      ?.then(() => {
        // do nothing
      })
      .finally(() => setIsLoading(false));
  }, [limit, marketData, page, loading, top100, loadNextPage]);

  return (
    <MarketList
      marketData={marketDataFiltered}
      filterByStarredAccount={filterByStarredAccount}
      starredMarketCoins={starredMarketCoins}
      search={search}
      loading={loading}
      refresh={refresh}
      counterCurrency={counterCurrency}
      range={range}
      selectCurrency={selectCurrency}
      isLoading={isLoading}
      onEndReached={onEndReached}
    />
  );
}

export default MarketListCont;
