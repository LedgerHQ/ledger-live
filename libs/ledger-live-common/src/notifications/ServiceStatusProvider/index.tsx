import React, { createContext, useContext, useMemo, useCallback, ReactElement } from "react";
import type { State, ServiceStatusUserSettings, Incident, ServiceStatusApi } from "./types";
import defaultNetworkApi from "./api";
import { fromPromise } from "xstate";
import { useMachine } from "@xstate/react";
import { serviceStatusMachine } from "./machine";
import { LEDGER_COMPONENTS } from "./ledger-components";
import { EntryPoint } from "./entry-points";

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
  return string.replace(/[.*+?^${}()[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function sanitizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " "); // collapse multiple spaces
}

/**
 * Filters service status incidents based on related tickers or Ledger components.
 *
 * ## Behavior:
 * - If there are no `tickers` or no `incidents`, returns an empty list.
 * - For each incident:
 *   1. ✅ If the incident has no components → keep it (always relevant).
 *   2. ✅ If at least one component name matches a known **Ledger component** → keep it.
 *   3. ✅ If at least one component name contains a **currency ticker** → keep it.
 *   4. ❌ Otherwise, the incident is discarded.
 *
 * @param {Incident[]} [incidents=[]] - List of incidents to filter.
 * @param {string[]} [tickers=[]] - List of currency tickers to match against incident components.
 * @param {EntryPoint} [entryPoint] - Entry point where the incidents are displayed (specifically for Ledger components)
 * @returns {Incident[]} The list of incidents relevant to the provided tickers or Ledger components.
 */

export function filterServiceStatusIncidents(
  incidents: Incident[] = [],
  tickers: string[] = [],
  entryPoint?: EntryPoint,
): Incident[] {
  if (!incidents.length) return [];
  if (!tickers.length) return [];

  const tickerRegex = tickers.length
    ? new RegExp(`\\b(${tickers.map(escapeRegExp).join("|")})\\b`, "i")
    : null;

  const ledgerComponentsSet = new Set(LEDGER_COMPONENTS.map(component => sanitizeName(component)));

  return incidents.filter(({ components }) => {
    // Keep global incidents with no components
    if (!components?.length) return true;

    return components.some(({ name }) => {
      const sanitizedName = sanitizeName(name);

      // Show Ledger components only for Notification Center
      if (entryPoint === "notifications" && ledgerComponentsSet.has(sanitizedName)) {
        return true;
      }

      // Show coin/ticker-specific components for flows
      if (tickerRegex && tickerRegex.test(sanitizedName)) {
        return true;
      }

      return false;
    });
  });
}

// filter out service status incidents by given currencies or fallback on context currencies
export function useFilteredServiceStatus(filters?: ServiceStatusUserSettings): StatusContextType {
  const stateData = useContext(ServiceStatusContext);
  const { incidents, context } = stateData;
  const filteredIncidents = useMemo(() => {
    return filterServiceStatusIncidents(
      incidents,
      filters?.tickers || context?.tickers,
      filters?.entryPoint,
    );
  }, [incidents, filters?.tickers, context?.tickers, filters?.entryPoint]);

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

  const [state, send] = useMachine(
    serviceStatusMachine.provide({
      actors: {
        fetchData: fromPromise(fetchData),
      },
      delays: {
        AUTO_UPDATE_DELAY: autoUpdateDelay,
      },
    }),
  );
  const api = useMemo(
    () => ({
      updateData: async () => {
        send({
          type: "UPDATE_DATA",
        });
      },
    }),
    [send],
  );
  const value = { ...(state.context || {}), ...api, context };
  return <ServiceStatusContext.Provider value={value}>{children}</ServiceStatusContext.Provider>;
};
