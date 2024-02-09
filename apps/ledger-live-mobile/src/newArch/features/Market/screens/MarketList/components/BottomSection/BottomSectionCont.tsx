import React, { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMarketData } from "@ledgerhq/live-common/market/MarketDataProvider";
import { MarketListRequestParams } from "@ledgerhq/live-common/market/types";
import {
  marketFilterByStarredAccountsSelector,
  starredMarketCoinsSelector,
} from "~/reducers/settings";
import { track } from "~/analytics";
import { setMarketFilterByStarredAccounts, setMarketRequestParams } from "~/actions/settings";
import { getAnalyticsProperties } from "LLM/features/Market/utils";
import BottomSection from "./BottomSection";

function BottomSectionCont() {
  const dispatch = useDispatch();
  const { requestParams, counterCurrency, refresh } = useMarketData();
  const { range, orderBy, order, top100 } = requestParams;
  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);
  const filterByStarredAccount: boolean = useSelector(marketFilterByStarredAccountsSelector);
  const firstMount = useRef(true); // To known if this is the first mount of the page

  useEffect(() => {
    if (firstMount.current) {
      // We don't want to refresh the market data directly on mount, the data is already refreshed with wanted parameters from MarketDataProviderWrapper
      firstMount.current = false;
      return;
    }
    if (filterByStarredAccount) {
      refresh({ starred: starredMarketCoins });
    } else {
      refresh({ starred: [], search: "" });
    }
  }, [refresh, filterByStarredAccount, starredMarketCoins]);

  const toggleFilterByStarredAccounts = useCallback(() => {
    if (!filterByStarredAccount) {
      track(
        "Page Market Favourites",
        getAnalyticsProperties(requestParams, {
          currencies: starredMarketCoins,
        }),
      );
    }
    dispatch(setMarketFilterByStarredAccounts(!filterByStarredAccount));
  }, [dispatch, filterByStarredAccount, requestParams, starredMarketCoins]);

  const onFilterChange = useCallback(
    (value: MarketListRequestParams) => {
      track(
        "Page Market",
        getAnalyticsProperties({
          ...requestParams,
          ...value,
        }),
      );
      dispatch(setMarketRequestParams(value));
      refresh(value);
    },
    [dispatch, refresh, requestParams],
  );

  return (
    <BottomSection
      onFilterChange={onFilterChange}
      filterByStarredAccount={filterByStarredAccount}
      toggleFilterByStarredAccounts={toggleFilterByStarredAccounts}
      range={range}
      orderBy={orderBy}
      order={order}
      top100={top100}
      counterCurrency={counterCurrency}
    />
  );
}

export default BottomSectionCont;
