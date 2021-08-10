import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  ReactElement,
} from "react";
import type { State, ServiceStatusApi } from "./types";
import defaultNetworkApi from "./api";
import { useMachine } from "@xstate/react";
import { serviceStatusMachine } from "./machine";
type Props = {
  children: React.ReactNode;
  autoUpdateDelay: number;
  networkApi?: ServiceStatusApi;
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
});
export function useServiceStatus(): StatusContextType {
  return useContext(ServiceStatusContext);
}
export const ServiceStatusProvider = ({
  children,
  autoUpdateDelay,
  networkApi = defaultNetworkApi,
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
  const value = { ...(state.context || {}), ...api };
  return (
    <ServiceStatusContext.Provider value={value}>
      {children}
    </ServiceStatusContext.Provider>
  );
};
