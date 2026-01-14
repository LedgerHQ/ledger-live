import { DdRumReactNavigationTracking } from "@datadog/mobile-react-navigation";
import { track } from "~/analytics";
import { navigationRef } from "~/rootnavigation";
import { viewNamePredicate } from "~/datadog";
import { logStartupEvent, type StartupEvent, startupEvents } from "./logStartupTime";
import { resolveStartupEvents, STARTUP_EVENTS } from "./resolveStartupEvents";
import {
  BleState,
  LargeMoverState,
  MarketState,
  ProtectState,
  SettingsState,
} from "~/reducers/types";
import { AccountRaw, PostOnboardingState } from "@ledgerhq/types-live";
import { TrustchainStore } from "@ledgerhq/ledger-key-ring-protocol/lib-es/store";
import { ExportedWalletState } from "@ledgerhq/live-wallet/lib-es/store";
import { CounterValuesStateRaw } from "@ledgerhq/live-countervalues/lib-es/types";
import { PersistedCAL } from "@ledgerhq/cryptoassets/lib-es/cal-client/persistence";
import { PersistedIdentities } from "@ledgerhq/client-ids/store";
import storage from "../storage";

type LastStartupEvent = (typeof STARTUP_EVENTS)["APP_STARTED" | "NAV_READY"];
export const LAST_STARTUP_EVENT_VALUES: string[] = [
  STARTUP_EVENTS.APP_STARTED,
  STARTUP_EVENTS.NAV_READY,
];

/**
 * Logs a startup-related event and conditionally triggers startup tracking once startup is complete.
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
    LAST_STARTUP_EVENT_VALUES.includes(e.event) ? e.event : [],
  );
  const isStartupDone = new Set(lastEventCalls).size === LAST_STARTUP_EVENT_VALUES.length;
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
  data: {
    bleData: BleState;
    settingsData: Partial<SettingsState>;
    accountsData: { active: Array<{ data: AccountRaw }> };
    postOnboardingState: PostOnboardingState;
    marketState: MarketState;
    trustchainStore: TrustchainStore;
    walletStore: ExportedWalletState;
    protect: ProtectState;
    initialCountervalues: CounterValuesStateRaw;
    largeMoverState: LargeMoverState;
    cryptoAssetsCache: PersistedCAL | null;
    persistedIdentities: PersistedIdentities | null;
  };
};

/**
 * Attempts to monitors the impact of the persistent storage on startup.
 * The first fields relates to the data needed to initialize the redux store.
 * Then to various currency specific data needed by the bridges.
 * We are moving away from this but in the meantime we should identify what to address in priority.
 * The last part relates to the overall storage size and key count.
 */
async function summarizeStorageData() {
  const storageReadEvent = getEvent(STARTUP_EVENTS.STORE_STORAGE_READ);
  const currencyHydratedEvent = getEvent<StorageCurrencyData>(STARTUP_EVENTS.CURRENCY_HYDRATED);
  const storeStorageData = storageReadEvent?.data;
  if (!storageReadEvent || !isStorageEventData(storeStorageData)) return {};

  // WARNING: this may be an expensive operation depending on the storage size
  const [storageKeys, storageStringified] = await Promise.all([
    storage.keys(),
    storage.stringify(),
  ]);

  return {
    // Fields about the persistent store data
    reduxStore_readTime: storeStorageData.readTime,
    reduxStore_size: sizeOf(storeStorageData.data),
    reduxStore_fieldsSize: Object.fromEntries(
      Object.entries(storeStorageData.data).map(([key, value]) => [key, sizeOf(value)]),
    ),
    reduxStore_accountsCount: storeStorageData.data.accountsData.active.length || 0,

    // Field related to the currency hydration
    ...formatCurrencyData(currencyHydratedEvent?.data),

    // Fields about whole storage
    fullStorage_size: storageStringified.length,
    fullStorage_keyCount: storageKeys.length,
  } as const;
}

function isStorageEventData(data: unknown): data is StoreStorageData {
  if (!data || typeof data !== "object") return false;
  return true;
}

export type StorageCurrencyData = { results?: HydrationResult[]; totalDuration: number };
type HydrationResult =
  | { status: "fulfilled"; id: string; value: unknown; duration: number }
  | { status: "rejected"; id: string; reason: unknown; duration: number };

function formatCurrencyData(data: StorageCurrencyData | undefined) {
  if (!data) return {};
  const { results, totalDuration } = data;
  const fulfilled = results?.filter(r => r.status === "fulfilled");
  const rejected = results?.filter(r => r.status === "rejected");
  const unknownCurrencies = rejected?.filter(e => e.reason === "unknown currency");
  const hydrationValues = fulfilled && Object.fromEntries(fulfilled.map(c => [c.id, c.value]));
  return {
    currencyStorage_hydrationDuration: totalDuration,
    currencyStorage_currencyCount: results?.length,
    currencyStorage_size: sizeOf(hydrationValues), // NOTE: this is the size of the successfully hydrated values only
    currencyStorage_values: fulfilled
      ?.map(r => ({ id: r.id, size: sizeOf(r.value), duration: r.duration }))
      ?.sort((a, b) => b.duration - a.duration),
    currencyStorage_rejectedCount: rejected?.length,
    currencyStorage_unknownCurrencies: unknownCurrencies?.map(r => r.id),
  } as const;
}

function sizeOf(obj: unknown): number {
  if (typeof obj === "undefined") return 0;
  try {
    const bytes = JSON.stringify(obj).length;
    return bytes;
  } catch {
    return NaN;
  }
}

function getEvent<Data = unknown>(name: string): StartupEvent<Data> | undefined {
  const event = startupEvents.find(e => e.event === name);
  return event ? (event as StartupEvent<Data>) : undefined;
}
