import {
  createAction,
  isAction,
  type Middleware,
  type ThunkDispatch,
  type UnknownAction,
} from "@reduxjs/toolkit";
import {
  exportCountervalues,
  filterSupportedTrackingPairs,
  hasNewCountervaluesToExport,
  importCountervalues,
  inferCurrencyAPIID,
  type CounterValuesState,
  type CounterValuesStateRaw,
  type CountervaluesSettings,
} from "@domain/entity-market-countervalues";
import {
  defaultCounterValueIdsSortedByMarketCap,
  loadCountervalues,
  marketCountervaluesApi,
  type RateSource,
} from "@domain/api-market-countervalues";
import type { Currency } from "@domain/entity-currency";
import {
  countervaluesPollingIsPollingSelector,
  countervaluesPollingTriggerLoadSelector,
  countervaluesStatePendingSelector,
  countervaluesStateSelector,
  setCountervaluesPollingIsPolling,
  setCountervaluesPollingTriggerLoad,
  setCountervaluesState,
  setCountervaluesStateError,
  setCountervaluesStatePending,
  type CountervaluesState,
} from "./countervaluesSlice";
import { log } from "./internals/logger";

// The countervalues loop as a Redux middleware: it restores the saved state, loads rates when the
// settings or the supported ids change, when a poll is asked for and on a timer, and nothing runs
// until `startCountervaluesSync` is dispatched.

const SUPPORTED_IDS_POLLING_MS = 30 * 60 * 1000;

/** The polling controls handed to `subscribeAppEvents`; they dispatch the slice's polling actions. */
export type CountervaluesPollingControls = {
  poll(): void;
  start(): void;
  stop(): void;
};

export type CountervaluesMiddlewareConfig<S> = {
  /**
   * Creates the selector of the settings the app computes from its own state, called on each start
   * so its memo starts fresh. It must return the same object while the inputs are unchanged: a new
   * one debounces a reload.
   */
  createSettingsSelector(): (state: S) => CountervaluesSettings;
  /** Where rates come from, built when the sync starts: the app chooses between real and mocked rates. */
  createRates(dispatch: ThunkDispatch<S, unknown, UnknownAction>): RateSource;
  /** Wires the platform's own triggers (focus, network, app state) while the sync runs. */
  subscribeAppEvents?(controls: CountervaluesPollingControls): () => void;
  /** Saves the state when it holds new rates to export. */
  persist?(raw: CounterValuesStateRaw): void;
  /** An action after which the sync starts again from the saved state, once the dispatch has settled. */
  restartOn?(action: UnknownAction): boolean;
  /** Time to wait after a settings change before reloading. */
  debounceDelay?: number;
  /** Time to wait before the first poll after the sync starts. */
  pollInitDelay?: number;
};

export type StartCountervaluesSyncPayload = {
  /** The raw state read from disk, restored once per start. Never kept in the store. */
  savedState?: CounterValuesStateRaw;
  /** Pins the settings instead of `selectSettings`, for test wrappers. */
  settings?: CountervaluesSettings;
};

export const startCountervaluesSync = createAction<StartCountervaluesSyncPayload | undefined>(
  "countervaluesSync/start",
);
export const stopCountervaluesSync = createAction("countervaluesSync/stop");

type RootState = { countervalues: CountervaluesState };

type Session = {
  savedState: CounterValuesStateRaw | undefined;
  pinnedSettings: CountervaluesSettings | undefined;
  selectSettings: (state: never) => CountervaluesSettings;
  rates: RateSource;
  unsubscribeSupportedIds: () => void;
  unsubscribeAppEvents: (() => void) | undefined;
  filtered: {
    settings: CountervaluesSettings;
    supportedIds: string[];
    value: CountervaluesSettings;
  } | null;
  /** The last filtered settings seen: a different object starts the reload debounce. */
  lastFiltered: CountervaluesSettings | null;
  debounceTimer: ReturnType<typeof setTimeout> | undefined;
  polling: { isPolling: boolean; refreshRate: number } | null;
  pollingTimer: ReturnType<typeof setTimeout> | undefined;
  lastPersisted: CounterValuesState;
  lastSupportedIdsError: unknown;
};

const supportedIdsEndpoint = marketCountervaluesApi.endpoints.getCounterValueIdsSortedByMarketCap;

/** Logs instead of throwing: a failure here must never surface in an unrelated `dispatch`. */
function guarded(step: string, fn: () => void) {
  try {
    fn();
  } catch (error) {
    try {
      log("countervalues", `sync ${step} failed`, { error });
    } catch {
      // the logger itself failed: nothing else to report to
    }
  }
}

export function createCountervaluesMiddleware<S>(
  config: CountervaluesMiddlewareConfig<S>,
): Middleware<object, S> {
  const debounceDelay = config.debounceDelay ?? 1000;
  const pollInitDelay = config.pollInitDelay ?? 3 * 1000;

  return api => {
    const dispatch = api.dispatch as ThunkDispatch<S, unknown, UnknownAction>;
    const getState = () => api.getState() as S & RootState;
    const selectSupportedIds = supportedIdsEndpoint.select();
    let session: Session | null = null;
    let passScheduled = false;
    let restartRequested = false;

    const controls: CountervaluesPollingControls = {
      poll: () => dispatch(setCountervaluesPollingTriggerLoad(true)),
      start: () => dispatch(setCountervaluesPollingIsPolling(true)),
      stop: () => dispatch(setCountervaluesPollingIsPolling(false)),
    };

    function supportedIdsResult() {
      // The endpoint's selector is typed on the API's own root state.
      return selectSupportedIds(getState() as never);
    }

    function settingsOf(s: Session): CountervaluesSettings {
      return s.selectSettings(getState() as never);
    }

    // The settings with unsupported pairs filtered out: a new object when either input changes.
    function filteredSettingsOf(s: Session): CountervaluesSettings {
      const settings = settingsOf(s);
      const supportedIds = supportedIdsResult().data ?? defaultCounterValueIdsSortedByMarketCap;
      if (s.filtered?.settings === settings && s.filtered.supportedIds === supportedIds) {
        return s.filtered.value;
      }
      const value = {
        ...settings,
        trackingPairs: filterSupportedTrackingPairs(settings.trackingPairs, supportedIds),
      };
      s.filtered = { settings, supportedIds, value };
      return value;
    }

    function restore(s: Session, settings: CountervaluesSettings) {
      const { savedState } = s;
      if (!savedState || typeof savedState !== "object") return;
      if (!Object.keys(savedState).length) return;
      dispatch(setCountervaluesState(importCountervalues(savedState, settings)));
    }

    function load(s: Session, currentState: CounterValuesState, settings: CountervaluesSettings) {
      dispatch(setCountervaluesPollingTriggerLoad(false));
      dispatch(setCountervaluesStatePending(true));
      const supportedIds = supportedIdsResult().data ?? defaultCounterValueIdsSortedByMarketCap;
      const { marketCapBatchingAfterRank } = settings;
      loadCountervalues(currentState, settings, {
        rates: s.rates,
        batchStrategySolver: {
          shouldBatchCurrencyFrom: (currency: Currency) => {
            if (currency.type === "FiatCurrency") return false;
            const i = supportedIds.indexOf(inferCurrencyAPIID(currency));
            return i === -1 || i > marketCapBatchingAfterRank;
          },
        },
        granularitiesRates: settings.granularitiesRates,
        log,
      }).then(
        next => {
          dispatch(setCountervaluesState(next));
          dispatch(setCountervaluesStatePending(false));
        },
        error => {
          dispatch(setCountervaluesStateError(error));
          dispatch(setCountervaluesStatePending(false));
        },
      );
    }

    // Arms the polling timer for the current polling flag and refresh rate, re-arming on a change.
    function syncPollingTimer(s: Session) {
      const isPolling = countervaluesPollingIsPollingSelector(getState());
      const { refreshRate } = settingsOf(s);
      if (s.polling?.isPolling === isPolling && s.polling.refreshRate === refreshRate) return;
      clearTimeout(s.pollingTimer);
      s.pollingTimer = undefined;
      s.polling = { isPolling, refreshRate };
      // Re-arming at 0 is a zero-delay self-rescheduling loop, so wait for a real rate.
      if (!isPolling || refreshRate <= 0) return;
      function pollingLoop() {
        guarded("poll", () => {
          dispatch(setCountervaluesPollingTriggerLoad(true));
        });
        s.pollingTimer = setTimeout(pollingLoop, refreshRate);
      }
      s.pollingTimer = setTimeout(pollingLoop, pollInitDelay);
    }

    function persist(s: Session) {
      if (!config.persist) return;
      const state = countervaluesStateSelector(getState());
      if (state === s.lastPersisted || !hasNewCountervaluesToExport(s.lastPersisted, state)) return;
      config.persist(exportCountervalues(state, settingsOf(s).trackingPairs));
      s.lastPersisted = state;
    }

    function start({ savedState, settings }: StartCountervaluesSyncPayload) {
      stop();
      // The settings first: if they cannot be computed, nothing starts.
      const selectSettings = settings ? () => settings : config.createSettingsSelector();
      selectSettings(getState());
      const rates = config.createRates(dispatch);
      const subscription = dispatch(
        supportedIdsEndpoint.initiate(undefined, {
          subscriptionOptions: {
            pollingInterval: SUPPORTED_IDS_POLLING_MS,
            refetchOnReconnect: true,
          },
        }),
      );
      const s: Session = {
        savedState,
        pinnedSettings: settings,
        selectSettings,
        rates,
        unsubscribeSupportedIds: () => subscription.unsubscribe(),
        unsubscribeAppEvents: undefined,
        filtered: null,
        lastFiltered: null,
        debounceTimer: undefined,
        polling: null,
        pollingTimer: undefined,
        lastPersisted: countervaluesStateSelector(getState()),
        lastSupportedIdsError: undefined,
      };
      session = s;
      // The first settings load right away; later ones are debounced.
      s.lastFiltered = filteredSettingsOf(s);
      dispatch(setCountervaluesPollingTriggerLoad(true));
      // A snapshot that cannot be restored is skipped: the loop still runs and loads from scratch.
      guarded("restore", () => restore(s, settingsOf(s)));
      syncPollingTimer(s);
      s.unsubscribeAppEvents = config.subscribeAppEvents?.(controls);
      schedulePass();
    }

    function stop() {
      const s = session;
      if (!s) return;
      session = null;
      clearTimeout(s.debounceTimer);
      clearTimeout(s.pollingTimer);
      s.unsubscribeSupportedIds();
      s.unsubscribeAppEvents?.();
      // A load in flight still lands: its result is dispatched whether the sync runs or not.
    }

    // One pass per tick: several actions dispatched together are handled once, after the dispatch
    // chain has unwound (so after any middleware that dispatches in reaction to the same action).
    function pass() {
      if (restartRequested) {
        restartRequested = false;
        const s = session;
        if (s) start({ savedState: s.savedState, settings: s.pinnedSettings });
        return;
      }
      const s = session;
      if (!s) return;

      const { error } = supportedIdsResult();
      if (error && error !== s.lastSupportedIdsError) {
        log("countervaluesApi", `getCounterValueIdsSortedByMarketCap failed`, { error });
      }
      s.lastSupportedIdsError = error;

      const filtered = filteredSettingsOf(s);
      if (filtered !== s.lastFiltered) {
        s.lastFiltered = filtered;
        clearTimeout(s.debounceTimer);
        s.debounceTimer = setTimeout(() => {
          s.debounceTimer = undefined;
          guarded("reload", () => {
            if (session === s) dispatch(setCountervaluesPollingTriggerLoad(true));
          });
        }, debounceDelay);
      }

      const state = getState();
      if (
        countervaluesPollingTriggerLoadSelector(state) &&
        !countervaluesStatePendingSelector(state)
      ) {
        load(s, countervaluesStateSelector(state), filtered);
      }

      syncPollingTimer(s);
      persist(s);
    }

    function schedulePass() {
      if (passScheduled) return;
      passScheduled = true;
      void Promise.resolve().then(() => {
        passScheduled = false;
        guarded("pass", pass);
      });
    }

    return next => action => {
      const result = next(action);
      if (!isAction(action)) return result;
      if (startCountervaluesSync.match(action)) {
        restartRequested = false;
        guarded("start", () => start(action.payload ?? {}));
      } else if (stopCountervaluesSync.match(action)) {
        restartRequested = false;
        guarded("stop", stop);
      } else if (session) {
        if (config.restartOn?.(action)) restartRequested = true;
        schedulePass();
      }
      return result;
    };
  };
}
