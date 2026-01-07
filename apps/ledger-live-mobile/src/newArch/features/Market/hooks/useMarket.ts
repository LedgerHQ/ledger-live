import { MarketListRequestParams } from "@ledgerhq/live-common/market/utils/types";
import { useMarketDataProvider } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { useCallback } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
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

  const updateMarketParams = useCallback(
    (payload?: MarketListRequestParams) => {
      dispatch(setMarketRequestParams(payload ?? {}));
    },
    [dispatch],
  );

  return {
    dispatch,
    updateMarketParams,
    starredMarketCoins,
    filterByStarredCurrencies,
    marketParams,
    liveCoinsList,
    supportedCurrencies,
    supportedCounterCurrencies,
    marketCurrentPage,
  };
}
