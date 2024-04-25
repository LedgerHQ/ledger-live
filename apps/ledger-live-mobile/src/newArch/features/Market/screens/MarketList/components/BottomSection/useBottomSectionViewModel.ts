import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MarketListRequestParams } from "@ledgerhq/live-common/market/utils/types";
import { track } from "~/analytics";
import { getAnalyticsProperties } from "LLM/features/Market/utils";
import {
  setMarketCurrentPage,
  setMarketFilterByStarredCurrencies,
  setMarketRequestParams,
} from "~/actions/market";
import { marketFilterByStarredCurrenciesSelector, marketParamsSelector } from "~/reducers/market";
import { starredMarketCoinsSelector } from "~/reducers/settings";

function useBottomSectionViewModel() {
  const dispatch = useDispatch();

  const marketParams = useSelector(marketParamsSelector);
  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);
  const filterByStarredCurrencies: boolean = useSelector(marketFilterByStarredCurrenciesSelector);

  const { range, orderBy, order, top100, counterCurrency } = marketParams;

  const toggleFilterByStarredCurrencies = useCallback(() => {
    if (!filterByStarredCurrencies) {
      track(
        "Page Market Favourites",
        getAnalyticsProperties(marketParams, {
          currencies: starredMarketCoins,
        }),
      );
    }

    dispatch(setMarketFilterByStarredCurrencies(!filterByStarredCurrencies));
    dispatch(setMarketCurrentPage(1));
    dispatch(setMarketRequestParams({ ...marketParams, page: 1 }));
  }, [dispatch, filterByStarredCurrencies, marketParams, starredMarketCoins]);

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
    filterByStarredCurrencies,
    toggleFilterByStarredCurrencies,
    range,
    orderBy,
    order,
    top100,
    counterCurrency,
  };
}

export default useBottomSectionViewModel;
