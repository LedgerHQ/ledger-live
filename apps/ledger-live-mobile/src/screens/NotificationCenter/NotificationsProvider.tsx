import React from "react";
import { useSelector } from "react-redux";
import { ServiceStatusProvider } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import Config from "react-native-config";
import { getEnv } from "@ledgerhq/live-env";
import { cryptoCurrenciesSelector } from "~/reducers/accounts";
import networkApi from "../Settings/Debug/__mocks__/serviceStatus";

let serviceStatusApi: typeof networkApi;

if (Config.MOCK || getEnv("MOCK")) {
  serviceStatusApi = networkApi;
}

type Props = {
  children: React.ReactNode;
};
export default function NotificationsProvider({ children }: Props) {
  const currenciesRaw: CryptoCurrency[] = useSelector(cryptoCurrenciesSelector);

  const { tickers } = currenciesRaw.reduce<{
    currencies: string[];
    tickers: string[];
  }>(
    ({ currencies, tickers }, { id, ticker }) => ({
      currencies: [...currencies, id],
      tickers: [...tickers, ticker],
    }),
    {
      currencies: [],
      tickers: [],
    },
  );

  return (
    <ServiceStatusProvider
      context={{
        tickers,
      }}
      autoUpdateDelay={60000}
      networkApi={serviceStatusApi}
    >
      {children}
    </ServiceStatusProvider>
  );
}
