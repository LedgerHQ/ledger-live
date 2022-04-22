/* eslint-disable import/named */
import React, { ReactElement } from "react";
import { useSelector } from "react-redux";
import apiMock from "@ledgerhq/live-common/lib/market/api/api.mock";
import Config from "react-native-config";
import { MarketDataProvider } from "@ledgerhq/live-common/lib/market/MarketDataProvider";
import { useNetInfo } from "@react-native-community/netinfo";
import { counterValueCurrencySelector } from "../../reducers/settings";

type Props = {
  children: React.ReactNode;
};

export default function MarketDataProviderWrapper({
  children,
}: Props): ReactElement {
  const counterValueCurrency: any = useSelector(counterValueCurrencySelector);
  const { isConnected } = useNetInfo();

  return (
    <MarketDataProvider
      {...(Config.MOCK ? { fetchApi: apiMock } : {})}
      countervalue={
        !isConnected
          ? undefined // without coutervalues service is not initialized with cg data, this forces it to fetch it at least once the network is on
          : counterValueCurrency
          // @TODO move this toLowercase check on live-common
          ? { ticker: counterValueCurrency.ticker.toLowerCase() }
          : counterValueCurrency
      }
      initState={{
        requestParams: {
          range: "24h",
          limit: 100,
          ids: [],
          starred: [],
          orderBy: "market_cap",
          order: "desc",
          search: "",
          liveCompatible: false,
          sparkline: false,
        },
      }}
    >
      {children}
    </MarketDataProvider>
  );
}
