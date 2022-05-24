/* eslint-disable import/named */
import React, { ReactElement } from "react";
import { useSelector } from "react-redux";
import apiMock from "@ledgerhq/live-common/lib/market/api/api.mock";
import Config from "react-native-config";
import { MarketDataProvider } from "@ledgerhq/live-common/lib/market/MarketDataProvider";
import { useNetInfo } from "@react-native-community/netinfo";
import {
  counterValueCurrencySelector,
  marketCounterCurrencySelector,
  marketFilterByStarredAccountsSelector,
  marketRequestParamsSelector,
  starredMarketCoinsSelector,
} from "../../reducers/settings";

type Props = {
  children: React.ReactNode;
};

export default function MarketDataProviderWrapper({
  children,
}: Props): ReactElement {
  const counterValueCurrency: any = useSelector(counterValueCurrencySelector);
  const marketRequestParams: any = useSelector(marketRequestParamsSelector);
  const marketCounterCurrency: any = useSelector(marketCounterCurrencySelector);
  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);
  const filterByStarredAccount: boolean = useSelector(
    marketFilterByStarredAccountsSelector,
  );
  const { isConnected } = useNetInfo();

  const counterCurrency = !isConnected
    ? undefined // without coutervalues service is not initialized with cg data, this forces it to fetch it at least once the network is on
    : marketCounterCurrency // If there is a stored market counter currency we use it, otherwise we use the setting countervalue currency
    ? { ticker: marketCounterCurrency }
    : counterValueCurrency
    ? // @TODO move this toLowercase check on live-common
      { ticker: counterValueCurrency.ticker?.toLowerCase() }
    : counterValueCurrency;

  return (
    <MarketDataProvider
      {...(Config.MOCK ? { fetchApi: apiMock } : {})}
      countervalue={counterCurrency}
      initState={{
        requestParams: {
          range: "24h",
          limit: 20,
          ids: [],
          orderBy: "market_cap",
          order: "desc",
          search: "",
          liveCompatible: false,
          sparkline: false,
          top100: false,
          ...marketRequestParams,
          starred: filterByStarredAccount ? starredMarketCoins : [],
        },
      }}
    >
      {children}
    </MarketDataProvider>
  );
}
