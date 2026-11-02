import { MarketListRequestParams } from "@ledgerhq/live-common/market/utils/types";
import { useCallback } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { setMarketRequestParams } from "~/actions/market";
import { marketParamsSelector } from "~/reducers/market";
import { starredMarketCoinsSelector } from "~/reducers/settings";

export function useMarket() {
  const dispatch = useDispatch();
  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);
  const marketParams = useSelector(marketParamsSelector);

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
    marketParams,
  };
}
