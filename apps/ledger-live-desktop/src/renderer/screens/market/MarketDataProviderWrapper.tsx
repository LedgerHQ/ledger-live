import React, { ReactElement } from "react";
import { useSelector } from "react-redux";
import { getEnv } from "@ledgerhq/live-common/env";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { MarketDataProvider } from "@ledgerhq/live-common/market/MarketDataProvider";
import apiMock from "@ledgerhq/live-common/market/api/api.mock";

type Props = {
  children: React.ReactNode;
};

export default function MarketDataProviderWrapper({ children }: Props): ReactElement {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  return (
    <MarketDataProvider
      {...(getEnv("PLAYWRIGHT_RUN") ? { fetchApi: apiMock } : {})}
      countervalue={counterValueCurrency}
    >
      {children}
    </MarketDataProvider>
  );
}
