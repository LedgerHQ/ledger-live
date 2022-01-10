import React, { ReactElement } from "react";
import { useSelector } from "react-redux";
// import { MarketDataProvider } from "@ledgerhq/live-common/lib/market/MarketDataProvider";
// import apiMock from "@ledgerhq/live-common/lib/market/api/api.mock";
// import Config from "react-native-config";
import { counterValueCurrencySelector } from "../../reducers/settings";

type Props = {
  children: React.ReactNode;
};

export default function MarketDataProviderWrapper({
  children,
}: Props): ReactElement {
  // const counterValueCurrency: any = useSelector(counterValueCurrencySelector);

  return <>{children}</>;
  /** 
  return (
    <MarketDataProvider
      fetchApi={Config.MOCK ? apiMock : undefined}
      countervalue={counterValueCurrency}
      initState={{
        requestParams: {
          range: "24h",
          limit: 20,
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
  */
}
