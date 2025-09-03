import { ServiceStatusProvider } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import { getEnv } from "@ledgerhq/live-env";
import { isEqual } from "lodash/fp";
import React from "react";
import Config from "react-native-config";
import { useSelector } from "react-redux";
import { createSelector } from "reselect";
import { cryptoCurrenciesSelector } from "~/reducers/accounts";
import networkApi from "../Settings/Debug/__mocks__/serviceStatus";

let serviceStatusApi: typeof networkApi;

if (Config.MOCK || getEnv("MOCK")) {
  serviceStatusApi = networkApi;
}

interface Props {
  children: React.ReactNode;
}

const selectContext = createSelector(cryptoCurrenciesSelector, xs => ({
  tickers: xs.map(x => x.ticker),
}));

export default function NotificationsProvider({ children }: Props) {
  const context = useSelector(selectContext, (a, b) => isEqual(a.tickers, b.tickers));

  return (
    <ServiceStatusProvider context={context} autoUpdateDelay={60000} networkApi={serviceStatusApi}>
      {children}
    </ServiceStatusProvider>
  );
}
