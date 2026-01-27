import { DdRumReactNavigationTracking } from "@datadog/mobile-react-navigation";
import { track } from "~/analytics";
import { navigationRef } from "~/rootnavigation";
import { viewNamePredicate } from "~/datadog";
import { logStartupEvent, type StartupEvent, startupEvents } from "./logStartupTime";
import { resolveStartupEvents, STARTUP_EVENTS } from "./resolveStartupEvents";
import mmkvStorageWrapper, { type MMKVMonitoredRead } from "../storage/mmkvStorageWrapper";

type LastStartupEvent = (typeof STARTUP_EVENTS)["APP_STARTED" | "NAV_READY"];
export const LAST_STARTUP_EVENT_VALUES = new Set<string>([
  STARTUP_EVENTS.APP_STARTED,
  STARTUP_EVENTS.NAV_READY,
]);

/**
 * Logs a startup event and conditionally sends the "app_startup_events" segment event once the startup is complete.
 *
 * Startup is considered complete when:
 * - Every value in {@link LAST_STARTUP_EVENT_VALUES} has been logged at least once in {@link startupEvents}
 *
 * In practice both "App started" and "Splash screen faded" might happen in different orders. Thus, this just makes sure
 * both events happened and at least once before triggering the tracking.
 * As the tracking functions should only be called once this also ensures this is the first time the given event was logged.
 *
 * @param eventName One of the last startup event labels defined in {@link LastStartupEvent}.
 * @returns The {@link StartupEvent} instance recorded for this call.
 */
export async function logLastStartupEvents(eventName: LastStartupEvent): Promise<StartupEvent> {
  const event = logStartupEvent(eventName);
  const lastEventCalls = startupEvents.flatMap(e =>
    LAST_STARTUP_EVENT_VALUES.has(e.event) ? e.event : [],
  );
  const isStartupDone = new Set(lastEventCalls).size === LAST_STARTUP_EVENT_VALUES.size;
  const isStartupLastCall = lastEventCalls.filter(e => e === eventName).length === 1;
  if (isStartupDone && isStartupLastCall) {
    try {
      DdRumReactNavigationTracking.startTrackingViews(navigationRef.current, viewNamePredicate);
      const [events, storageState] = await Promise.all([
        resolveStartupEvents(),
        summarizeStorageData(),
      ]);
      const appStartupTime = events.find(e => e.event === eventName)?.time ?? 0;
      await track("app_startup_events", { appStartupTime, ...storageState, events });
    } catch (error) {
      console.error("Error during app startup tracking:", error);
    }
  }
  return event;
}

export type StoreStorageData = {
  readTime: number;
  mmkvRead: MMKVMonitoredRead[];
};

/**
 * Attempts to monitor the impact of the persistent storage on startup.
 * The first fields relate to the data needed to initialize the redux store.
 * Then to various currency specific data needed by the bridges.
 * We are moving away from this but in the meantime we should identify what to address in priority.
 * The last part relates to the overall storage size and key count.
 */
async function summarizeStorageData() {
  const storageReadEvent = getEvent<StoreStorageData>(STARTUP_EVENTS.STORE_STORAGE_READ);
  const currencyHydratedEvent = getEvent<StorageCurrencyData>(STARTUP_EVENTS.CURRENCY_HYDRATED);
  const storeStorageData = storageReadEvent?.data;
  if (!storageReadEvent || !storeStorageData) return {};

  const staticKeys = new Set([
    "ble",
    "settings",
    "postOnboarding",
    "market",
    "trustchain",
    "wallet",
    "protect",
    "largeMover",
    "cryptoAssetsCache",
    "identities",
    "countervalues.status",
    "accounts.sort",
  ]);
  const mmkvReadSizes: Array<[string, number | undefined]> = [];
  const accounts = { count: 0, size: 0 };
  const countervalues = { count: 0, size: 0 };
  const unknowns = { count: 0, size: 0 };
  storeStorageData.mmkvRead.forEach(({ key, value }) => {
    if (staticKeys.has(key)) {
      mmkvReadSizes.push([`reduxStore_${key}Size`, value?.length]);
    } else if (key.startsWith("accounts.")) {
      accounts.count++;
      accounts.size += value?.length ?? 0;
    } else if (key.startsWith("countervalues.")) {
      countervalues.count += 1;
      countervalues.size += value?.length ?? 0;
    } else {
      unknowns.count++;
      unknowns.size += value?.length ?? 0;
    }
  });
  mmkvReadSizes.push(
    ["reduxStore_accountsSize", accounts.size],
    ["reduxStore_countervaluesSize", countervalues.size],
    ["reduxStore_unknownsSize", unknowns.size || undefined],
  );

  return {
    // Fields about the persistent store data
    reduxStore_readTime: storeStorageData.readTime,
    reduxStore_size: mmkvReadSizes.reduce((acc, [, size]) => acc + (size ?? 0), 0),
    ...Object.fromEntries(mmkvReadSizes),
    reduxStore_accountsCount: accounts.count,
    reduxStore_countervaluesCount: countervalues.count,
    reduxStore_unknownsCount: unknowns.count || undefined,

    // Field related to the currency hydration
    ...formatCurrencyData(currencyHydratedEvent?.data),

    // Fields about whole storage
    fullStorage_size: mmkvStorageWrapper.size(),
    fullStorage_keyCount: mmkvStorageWrapper.keys().length,
  } as const;
}

export type StorageCurrencyData = {
  results: HydrationResult[];
  totalDuration: number;
  mmkvRead: MMKVMonitoredRead[];
};
type HydrationResult =
  | { status: "fulfilled"; id: string; duration: number }
  | { status: "rejected"; id: string; reason: unknown; duration: number };

function formatCurrencyData(data: StorageCurrencyData | undefined) {
  if (!data) return {};
  const { results, totalDuration, mmkvRead } = data;
  const entries = results.map<[string, { duration: number; size: number | undefined }]>(
    ({ id, duration }) => [
      id,
      { duration, size: mmkvRead.find(m => m.key === `bridgeproxypreload_${id}`)?.value?.length },
    ],
  );

  const rejected = results.filter(
    (r): r is Extract<HydrationResult, { status: "rejected" }> => r.status === "rejected",
  );
  const unknownCurrencies = rejected.filter(e => e.reason === "unknown currency");

  return {
    currencyStorage_hydrationDuration: totalDuration,
    currencyStorage_currencyCount: results?.length,
    currencyStorage_size: entries.reduce((acc, [, v]) => acc + (v.size ?? 0), 0),
    currencyStorage_entries: Object.fromEntries(entries),
    currencyStorage_rejectedCount: rejected.length,
    currencyStorage_unknownCurrencies: unknownCurrencies.length
      ? unknownCurrencies.map(r => r.id)
      : undefined,
  } as const;
}

function getEvent<Data = unknown>(name: string): StartupEvent<Data> | undefined {
  const event = startupEvents.find(e => e.event === name);
  return event ? (event as StartupEvent<Data>) : undefined;
}
