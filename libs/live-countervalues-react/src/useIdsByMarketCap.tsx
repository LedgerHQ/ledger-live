import api from "@ledgerhq/live-countervalues/api/index";
import { log } from "@ledgerhq/logs";
import { useSyncExternalStore } from "react";

const MARKETCAP_REFRESH = 30 * 60000;
const MARKETCAP_REFRESH_ON_ERROR = 60000;

type MarketcapStore = {
  ids: string[];
  lastUpdated: number;
  timeout: ReturnType<typeof setTimeout> | null;
  listeners: Set<() => void>;
};

const marketcapStore: MarketcapStore = {
  ids: [],
  lastUpdated: 0,
  timeout: null,
  listeners: new Set(),
};

function notifyMarketcapListeners() {
  marketcapStore.listeners.forEach(listener => listener());
}

function clearMarketcapTimeout() {
  if (marketcapStore.timeout) {
    clearTimeout(marketcapStore.timeout);
    marketcapStore.timeout = null;
  }
}

function scheduleMarketcapRefresh(ms: number) {
  clearMarketcapTimeout();
  marketcapStore.timeout = setTimeout(() => {
    void ensureMarketcapFresh();
  }, ms);
}

async function ensureMarketcapFresh() {
  const now = Date.now();
  if (marketcapStore.lastUpdated && now - marketcapStore.lastUpdated <= MARKETCAP_REFRESH) {
    scheduleMarketcapRefresh(MARKETCAP_REFRESH - (now - marketcapStore.lastUpdated));
    return;
  }

  try {
    const fetchedIds = await api.fetchIdsSortedByMarketcap();
    marketcapStore.ids = fetchedIds;
    marketcapStore.lastUpdated = Date.now();
    notifyMarketcapListeners();
    scheduleMarketcapRefresh(MARKETCAP_REFRESH);
  } catch (error) {
    log("countervalues", "error fetching marketcap ids " + error);
    scheduleMarketcapRefresh(MARKETCAP_REFRESH_ON_ERROR);
  }
}

function subscribeMarketcap(listener: () => void) {
  marketcapStore.listeners.add(listener);
  if (marketcapStore.listeners.size === 1) {
    void ensureMarketcapFresh();
  } else if (marketcapStore.lastUpdated === 0) {
    void ensureMarketcapFresh();
  }

  return () => {
    marketcapStore.listeners.delete(listener);
    if (marketcapStore.listeners.size === 0) {
      clearMarketcapTimeout();
    }
  };
}

function getMarketcapSnapshot() {
  return marketcapStore.ids;
}

export function useIdsByMarketCap(): string[] {
  return useSyncExternalStore(subscribeMarketcap, getMarketcapSnapshot, getMarketcapSnapshot);
}
