import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MarketListRequestParams } from "@ledgerhq/live-common/market/types";
import { track } from "~/analytics";
import { getAnalyticsProperties } from "LLM/features/Market/utils";
import { setMarketFilterByStarredAccounts, setMarketRequestParams } from "~/actions/market";
import {
  marketFilterByStarredAccountsSelector,
  marketRequestParamsSelector,
  starredMarketCoinsSelector,
} from "~/reducers/market";

function useBottomSectionViewModel() {
  const dispatch = useDispatch();

  const marketParams = useSelector(marketRequestParamsSelector);
  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);
  const filterByStarredAccount: boolean = useSelector(marketFilterByStarredAccountsSelector);

  const { range, orderBy, order, top100, counterCurrency } = marketParams;

  const toggleFilterByStarredAccounts = useCallback(() => {
    if (!filterByStarredAccount) {
      track(
        "Page Market Favourites",
        getAnalyticsProperties(marketParams, {
          currencies: starredMarketCoins,
        }),
      );
    }
    dispatch(setMarketFilterByStarredAccounts(!filterByStarredAccount));
  }, [dispatch, filterByStarredAccount, marketParams, starredMarketCoins]);

  const onFilterChange = useCallback(
    (value: MarketListRequestParams) => {
      track(
        "Page Market",
        getAnalyticsProperties({
          ...marketParams,
          ...value,
        }),
      );
      dispatch(setMarketRequestParams(value));
    },
    [dispatch, marketParams],
  );

  return {
    onFilterChange,
    filterByStarredAccount,
    toggleFilterByStarredAccounts,
    range,
    orderBy,
    order,
    top100,
    counterCurrency,
  };
}

export default useBottomSectionViewModel;
