import React from "react";
import { useSelector } from "LLD/hooks/redux";
import { ServiceStatusProvider } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import { getEnv } from "@ledgerhq/live-env";
import { cryptoCurrenciesSelector } from "~/renderer/reducers/accounts";
import networkApi from "../../../tests/mocks/serviceStatusHelpers";

let serviceStatusApi: typeof networkApi | undefined;

if (getEnv("MOCK") || getEnv("PLAYWRIGHT_RUN")) {
  serviceStatusApi = networkApi;
}

type Props = {
  children: React.ReactNode;
};

export function ServiceStatusProviderWrapper({ children }: Props) {
  const currenciesRaw = useSelector(cryptoCurrenciesSelector);
  const tickers = currenciesRaw.map(({ ticker }) => ticker);
  const autoUpdateDelay = getEnv("PLAYWRIGHT_RUN") || getEnv("MOCK") ? 16 : 60000;

  return (
    <ServiceStatusProvider
      context={{ tickers }}
      autoUpdateDelay={autoUpdateDelay}
      networkApi={serviceStatusApi}
    >
      {children}
    </ServiceStatusProvider>
  );
}
