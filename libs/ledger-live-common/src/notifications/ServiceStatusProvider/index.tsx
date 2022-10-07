import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  ReactElement,
} from "react";
import type {
  State,
  ServiceStatusUserSettings,
  Incident,
  ServiceStatusApi,
} from "./types";
import defaultNetworkApi from "./api";
import { useMachine } from "@xstate/react";
import { serviceStatusMachine } from "./machine";
type Props = {
  children: React.ReactNode;
  autoUpdateDelay: number;
  networkApi?: ServiceStatusApi;
  context?: ServiceStatusUserSettings;
};

type API = {
  updateData: () => Promise<void>;
};

export type StatusContextType = State & API;
const ServiceStatusContext = createContext<StatusContextType>({
  incidents: [],
  isLoading: false,
  lastUpdateTime: undefined,
  error: undefined,
  updateData: () => Promise.resolve(),
  context: { tickers: [] },
});

export function useServiceStatus(): StatusContextType {
  return useContext(ServiceStatusContext);
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export function filterServiceStatusIncidents(
  incidents: Incident[],
  tickers: string[] = []
): Incident[] {
  if (
    !tickers ||
    tickers.length === 0 ||
    !incidents ||
    incidents.length === 0
  ) {
    return [];
  }

  const tickersRegex = new RegExp(escapeRegExp(tickers.join("|")), "i");
  return incidents.filter(
    ({ components }) =>
      !components || // dont filter out if no components
      components.length === 0 ||
      components.some(({ name }) => tickersRegex.test(name)) // component name should hold currency name
  );
}

// filter out service status incidents by given currencies or fallback on context currencies
export function useFilteredServiceStatus(
  filters?: ServiceStatusUserSettings
): StatusContextType {
  const stateData = useContext(ServiceStatusContext);
  const { incidents, context } = stateData;

  const filteredIncidents = useMemo(() => {
    return filterServiceStatusIncidents(
      incidents,
      filters?.tickers || context?.tickers
    );
  }, [incidents, context, filters?.tickers]);

  return { ...stateData, incidents: filteredIncidents };
}

export const ServiceStatusProvider = ({
  children,
  autoUpdateDelay,
  networkApi = defaultNetworkApi,
  context,
}: Props): ReactElement => {
  const fetchData = useCallback(async () => {
    const serviceStatusSummary = await networkApi.fetchStatusSummary();
    return {
      incidents: serviceStatusSummary.incidents,
      updateTime: Date.now(),
    };
  }, [networkApi]);

  const [state, send] = useMachine(serviceStatusMachine, {
    services: {
      fetchData,
    },
    delays: {
      AUTO_UPDATE_DELAY: autoUpdateDelay,
    },
  });
  const api = useMemo(
    () => ({
      updateData: async () => {
        send({
          type: "UPDATE_DATA",
        });
      },
    }),
    [send]
  );
  const value = { ...(state.context || {}), ...api, context };
  return (
    <ServiceStatusContext.Provider value={value}>
      {children}
    </ServiceStatusContext.Provider>
  );
};
