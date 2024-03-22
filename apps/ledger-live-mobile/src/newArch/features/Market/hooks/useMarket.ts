import { MarketListRequestParams } from "@ledgerhq/live-common/market/types";
import { useMarketDataProvider } from "@ledgerhq/live-common/market/v2/useMarketDataProvider";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setMarketRequestParams } from "~/actions/market";
import {
  starredMarketCoinsSelector,
  marketFilterByStarredAccountsSelector,
  marketRequestParamsSelector,
} from "~/reducers/market";

export function useMarket() {
  const dispatch = useDispatch();
  const { supportedCurrencies, liveCoinsList, supportedCounterCurrencies } =
    useMarketDataProvider();
  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);
  const filterByStarredAccount: boolean = useSelector(marketFilterByStarredAccountsSelector);
  const marketParams = useSelector(marketRequestParamsSelector);

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
    filterByStarredAccount,
    marketParams,
    liveCoinsList,
    supportedCurrencies,
    supportedCounterCurrencies,
  };
}
