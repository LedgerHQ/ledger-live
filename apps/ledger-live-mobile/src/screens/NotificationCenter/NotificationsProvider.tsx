import { ServiceStatusProvider } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import type { ServiceStatusApi } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/types";
import { getEnv } from "@ledgerhq/live-env";
import { isEqual } from "lodash/fp";
import React from "react";
import Config from "react-native-config";
import { useSelector } from "~/context/hooks";
import { createSelector } from "~/context/selectors";
import { cryptoCurrenciesSelector } from "~/reducers/accounts";
import debugNetworkApi from "../Settings/Debug/__mocks__/serviceStatus";
import mswNetworkApi from "../../mocks/status/networkApi";

let serviceStatusApi: ServiceStatusApi | undefined;
if (process.env.MSW_ENABLED === "true") {
  serviceStatusApi = mswNetworkApi;
} else if (Config.MOCK || getEnv("MOCK")) {
  serviceStatusApi = debugNetworkApi;
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
