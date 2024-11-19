import { MarketListRequestParams } from "@ledgerhq/live-common/market/utils/types";
import { useMarketDataProvider } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setMarketRequestParams } from "~/actions/market";
import {
  marketParamsSelector,
  marketCurrentPageSelector,
  marketFilterByStarredCurrenciesSelector,
} from "~/reducers/market";
import { starredMarketCoinsSelector } from "~/reducers/settings";

export function useMarket() {
  const dispatch = useDispatch();
  const { supportedCurrencies, liveCoinsList, supportedCounterCurrencies } =
    useMarketDataProvider();
  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);
  const filterByStarredCurrencies: boolean = useSelector(marketFilterByStarredCurrenciesSelector);
  const marketParams = useSelector(marketParamsSelector);
  const marketCurrentPage = useSelector(marketCurrentPageSelector);

  const refresh = useCallback(
    (payload?: MarketListRequestParams) => {
      dispatch(setMarketRequestParams(payload ?? {}));
    },
    [dispatch],
  );

  return {
    dispatch,
    refresh,
    starredMarketCoins,
    filterByStarredCurrencies,
    marketParams,
    liveCoinsList,
    supportedCurrencies,
    supportedCounterCurrencies,
    marketCurrentPage,
  };
}
