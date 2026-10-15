import type { Dispatch, MiddlewareAPI, ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import {
  exportCountervalues,
  filterSupportedTrackingPairs,
  hasNewCountervaluesToExport,
  importCountervalues,
  inferCurrencyAPIID,
  setCountervaluesState,
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
import type {
  CountervaluesMiddlewareConfig,
  CountervaluesPollingControls,
  StartCountervaluesSyncPayload,
} from "../middleware";
import {
  countervaluesStateSelector,
  countervaluesSyncIsPollingSelector,
  type CountervaluesStoreState,
} from "../reducer";
import {
  countervaluesLoadFailed,
  countervaluesLoadRequested,
  countervaluesLoadStarted,
  countervaluesLoadSucceeded,
  countervaluesPollingSet,
  type CountervaluesLoad,
} from "../slice";
import { log } from "../../utils/internals/logger";

/** Before the first start: no session, no tick queued. */
export const initialSyncState: SyncState = { status: "idle", queuedTick: "none" };

/**
 * Builds the context of one store: its dispatch and state, the supported-ids reader, the polling
 * controls and the app's configuration with its delays resolved.
 *
 * @param api
 * The store, as the middleware receives it.
 *
 * @param config
 * The app's configuration.
 */
export function createSyncContext<S>(
  api: MiddlewareAPI<Dispatch, S>,
  config: CountervaluesMiddlewareConfig<S>,
): SyncContext<S> {
  const dispatch = api.dispatch as ThunkDispatch<S, unknown, UnknownAction>;
  const getState = () => api.getState() as S & CountervaluesRootState;
  return {
    dispatch,
    getState,
    readSupportedIds: createSupportedIdsReader(getState),
    controls: createPollingControls(dispatch),
    config: {
      ...config,
      debounceDelay: config.debounceDelay ?? 1000,
      pollInitDelay: config.pollInitDelay ?? 3 * 1000,
    },
  };
}

/**
 * Closes the running session, if any, then opens and starts a new one.
 *
 * @param context
 * The store the sync runs in.
 *
 * @param ref
 * The store's sync state.
 *
 * @param payload
 * The saved state to restore, and the settings to pin, if any.
 */
export function startSync<S>(
  context: SyncContext<S>,
  ref: SyncStateRef,
  payload: StartCountervaluesSyncPayload,
): void {
  stopSync(ref);
  const session = openSession(context, payload);
  ref.current = { status: "running", session, queuedTick: ref.current.queuedTick };
  startSession(context, session);
}

/**
 * Closes the running session, if any. The state goes idle first: closing dispatches, and those
 * actions must not queue a tick for the closed session.
 *
 * @param ref
 * The store's sync state.
 */
export function stopSync(ref: SyncStateRef): void {
  const previous = ref.current;
  ref.current = { status: "idle", queuedTick: cancelRestart(previous.queuedTick) };
  if (previous.status === "running") closeSession(previous.session);
}

/**
 * Records what the queued tick will do after an action, and queues the tick if none is. It runs
 * once the dispatch chain has unwound, so after any middleware reacting to the action.
 *
 * @param context
 * The store the sync runs in.
 *
 * @param ref
 * The store's sync state.
 *
 * @param action
 * An action other than a start or a stop, once the store has reduced it.
 */
export function onAction<S>(
  context: SyncContext<S>,
  ref: SyncStateRef,
  action: UnknownAction,
): void {
  const state = ref.current;
  if (state.status !== "running") return;
  const restart = context.config.restartOn?.(action) ?? false;
  ref.current = { ...state, queuedTick: nextQueuedTick(state.queuedTick, restart) };
  if (state.queuedTick === "none") void Promise.resolve().then(() => runTick(context, ref));
}

/**
 * Runs one step of the sync and logs its failure instead of throwing, so a failing step never
 * surfaces in an unrelated `dispatch` nor kills a timer.
 *
 * @param step The step's name, logged as `sync <step> failed`.
 * @param run The step.
 */
export function tryStep(step: string, run: () => void): void {
  try {
    run();
  } catch (error) {
    try {
      log("countervalues", `sync ${step} failed`, { error });
    } catch {
      // the logger itself failed: nothing else to report to
    }
  }
}

/**
 * What the queued tick will do once one more action went through the store. A restart wins over
 * a reconcile, and stays queued once asked for.
 *
 * @param queuedTick
 * What the tick would do before this action; `none` when no tick is queued yet.
 *
 * @param restart
 * Whether this action matches `restartOn`.
 */
export function nextQueuedTick(queuedTick: QueuedTick, restart: boolean): QueuedTick {
  return restart || queuedTick === "restart" ? "restart" : "reconcile";
}

/**
 * What the queued tick will do after a start or a stop: a restart asked for in the same tick no
 * longer applies, and a queued tick stays queued, to reconcile.
 *
 * @param queuedTick
 * What the tick would do before the start or the stop.
 */
export function cancelRestart(queuedTick: QueuedTick): Exclude<QueuedTick, "restart"> {
  return queuedTick === "restart" ? "reconcile" : queuedTick;
}

/**
 * The controls handed to `subscribeAppEvents`: each dispatches one of the slice's polling actions.
 *
 * @param dispatch The store's dispatch.
 */
export function createPollingControls(
  dispatch: (action: UnknownAction) => unknown,
): CountervaluesPollingControls {
  return {
    poll: () => dispatch(countervaluesLoadRequested()),
    start: () => dispatch(countervaluesPollingSet(true)),
    stop: () => dispatch(countervaluesPollingSet(false)),
  };
}

/**
 * The settings without the tracking pairs the backend does not support. Returns the same object
 * while neither the settings nor the supported ids change, so callers can compare by identity.
 *
 * @param context
 * The store the sync runs in.
 *
 * @param session
 * The session holding the selector and the memo.
 */
export function readSupportedSettings<S>(
  context: SyncContext<S>,
  session: Session,
): CountervaluesSettings {
  const settings = readSettings(context, session);
  const supportedIds = readSupportedIdsOrDefault(context);
  const memo = session.supportedSettingsMemo;
  if (memo?.settings === settings && memo.supportedIds === supportedIds) return memo.value;
  const value = {
    ...settings,
    trackingPairs: filterSupportedTrackingPairs(settings.trackingPairs, supportedIds),
  };
  session.supportedSettingsMemo = { settings, supportedIds, value };
  return value;
}

/**
 * Puts the state read from disk in the store. An absent or empty snapshot is skipped.
 *
 * @param context
 * The store the sync runs in.
 *
 * @param savedState
 * The raw state read from disk.
 *
 * @param settings
 * The settings whose tracking pairs the snapshot is imported for.
 */
export function restoreSavedState<S>(
  context: SyncContext<S>,
  savedState: CounterValuesStateRaw | undefined,
  settings: CountervaluesSettings,
): void {
  if (!savedState || typeof savedState !== "object") return;
  if (!Object.keys(savedState).length) return;
  context.dispatch(setCountervaluesState(importCountervalues(savedState, settings)));
}

/**
 * Whether a currency's rates are fetched in a batch rather than on their own: fiats never are,
 * cryptos are when unsupported or ranked below `batchingAfterRank` by market cap.
 *
 * @param currency The currency the rates are fetched from.
 * @param supportedIds The supported crypto ids, sorted by market cap.
 * @param batchingAfterRank The last rank fetched on its own.
 */
export function shouldBatchCurrency(
  currency: Currency,
  supportedIds: string[],
  batchingAfterRank: number,
): boolean {
  if (currency.type === "FiatCurrency") return false;
  const rank = supportedIds.indexOf(inferCurrencyAPIID(currency));
  return rank === -1 || rank > batchingAfterRank;
}

/**
 * Asks for a load once the settings have stopped changing for `debounceDelay`. Each call restarts
 * the wait, and a session closed in the meantime asks for nothing.
 *
 * @param context The store the sync runs in.
 * @param session The session holding the timer.
 */
export function debounceReload<S>(context: SyncContext<S>, session: Session): void {
  clearTimeout(session.debounceTimer);
  session.debounceTimer = setTimeout(() => {
    session.debounceTimer = undefined;
    tryStep("reload", () => {
      if (session.status === "open") context.dispatch(countervaluesLoadRequested());
    });
  }, context.config.debounceDelay);
}

/**
 * Hands the state to the app's `persist` when it holds rates the last save did not have.
 *
 * @param context
 * The store the sync runs in.
 *
 * @param
 * session The session holding the last saved state.
 */
export function persistNewRates<S>(context: SyncContext<S>, session: Session): void {
  const { persist } = context.config;
  if (!persist) return;
  const state = countervaluesStateSelector(context.getState());
  if (state === session.lastPersisted) return;
  if (!hasNewCountervaluesToExport(session.lastPersisted, state)) return;
  persist(exportCountervalues(state, readSettings(context, session).trackingPairs));
  session.lastPersisted = state;
}

/**
 * Releases what the session acquired. A load in flight still lands.
 *
 * @param session
 * The session to close.
 */
export function closeSession(session: Session): void {
  session.status = "closed";
  clearTimeout(session.debounceTimer);
  clearTimeout(session.pollingTimer);
  session.unsubscribeSupportedIds();
  session.unsubscribeAppEvents?.();
}

/**
 * Runs what the tick was queued for, on the session running now: a restart from its saved state,
 * or a reconcile. A tick that finds no session does nothing.
 *
 * @param context
 * The store the sync runs in.
 *
 * @param ref
 * The store's sync state.
 */
function runTick<S>(context: SyncContext<S>, ref: SyncStateRef): void {
  const { queuedTick } = ref.current;
  ref.current = { ...ref.current, queuedTick: "none" };
  const state = ref.current;
  if (state.status !== "running") return;
  const { session } = state;
  if (queuedTick === "restart") {
    const { savedState, pinnedSettings } = session;
    tryStep("restart", () => startSync(context, ref, { savedState, settings: pinnedSettings }));
  } else if (queuedTick === "reconcile") {
    tryStep("reconcile", () => reconcileSessionWithStore(context, session));
  }
}

/**
 * Acquires what a sync needs: the settings selector, the rate source and the supported-ids
 * subscription. The settings are computed first, so a selector that throws acquires nothing.
 *
 * @param context
 * The store the sync runs in.
 *
 * @param payload
 * The saved state to restore, and the settings to pin, if any.
 *
 * @returns
 * An open session, not started yet.
 */
function openSession<S>(
  context: SyncContext<S>,
  { savedState, settings }: StartCountervaluesSyncPayload,
): Session {
  const { config, dispatch, getState } = context;
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
  return {
    status: "open",
    savedState,
    pinnedSettings: settings,
    selectSettings,
    rates,
    unsubscribeSupportedIds: () => subscription.unsubscribe(),
    unsubscribeAppEvents: undefined,
    supportedSettingsMemo: null,
    lastSupportedSettings: null,
    debounceTimer: undefined,
    polling: null,
    pollingTimer: undefined,
    lastPersisted: countervaluesStateSelector(getState()),
    lastSupportedIdsError: undefined,
  };
}

/**
 * Begins an opened session: asks for the first load right away, restores the saved state, arms
 * the polling timer and wires the app's events. A snapshot that cannot be restored is skipped,
 * and the rest still runs, loading from scratch.
 *
 * @param context
 * The store the sync runs in.
 *
 * @param session
 * The session returned by {@link openSession}.
 */
function startSession<S>(context: SyncContext<S>, session: Session): void {
  session.lastSupportedSettings = readSupportedSettings(context, session);
  context.dispatch(countervaluesLoadRequested());
  tryStep("restore", () => {
    restoreSavedState(context, session.savedState, readSettings(context, session));
    // Disk already holds what was just restored: only a load adding to it is worth a save.
    session.lastPersisted = countervaluesStateSelector(context.getState());
  });
  syncPollingTimer(context, session);
  session.unsubscribeAppEvents = context.config.subscribeAppEvents?.(context.controls);
}

/**
 * Brings the session in line with the store after a dispatch: debounces a reload when the
 * supported settings changed, loads when one is asked for and none is pending, keeps the polling
 * timer in line and persists new rates. The store is only read here; it changes through the
 * actions these steps dispatch.
 *
 * @param context
 * The store the sync runs in.
 *
 * @param session
 * The running session.
 */
function reconcileSessionWithStore<S>(context: SyncContext<S>, session: Session): void {
  logNewSupportedIdsError(context, session);

  const settings = readSupportedSettings(context, session);
  if (settings !== session.lastSupportedSettings) {
    session.lastSupportedSettings = settings;
    debounceReload(context, session);
  }

  const state = context.getState();
  if (readLoad(state) === "requested") {
    loadRates(context, session.rates, countervaluesStateSelector(state), settings);
  }

  syncPollingTimer(context, session);
  persistNewRates(context, session);
}

/**
 * Loads the rates for `settings` on top of `currentState`, marking the state pending until the
 * result or the error lands. The result is dispatched even if the sync stopped in the meantime.
 *
 * @param context
 * The store the sync runs in.
 *
 * @param rates
 * Where the rates come from.
 *
 * @param currentState
 * The state the load starts from.
 *
 * @param settings
 * The supported settings to load for.
 */
function loadRates<S>(
  context: SyncContext<S>,
  rates: RateSource,
  currentState: CounterValuesState,
  settings: CountervaluesSettings,
): void {
  const { dispatch } = context;
  dispatch(countervaluesLoadStarted());
  const supportedIds = readSupportedIdsOrDefault(context);
  loadCountervalues(currentState, settings, {
    rates,
    batchStrategySolver: {
      shouldBatchCurrencyFrom: currency =>
        shouldBatchCurrency(currency, supportedIds, settings.marketCapBatchingAfterRank),
    },
    granularitiesRates: settings.granularitiesRates,
    log,
  }).then(
    next => {
      dispatch(setCountervaluesState(next));
      dispatch(countervaluesLoadSucceeded());
    },
    error => {
      dispatch(countervaluesLoadFailed(error));
    },
  );
}

/**
 * Keeps the polling timer in line with the slice's polling flag and the refresh rate: armed while
 * polling with a positive rate, re-armed when either changes, cleared otherwise. The first poll
 * waits `pollInitDelay`, the next ones the refresh rate.
 *
 * @param context
 * The store the sync runs in.
 *
 * @param session
 * The session holding the timer.
 */
function syncPollingTimer<S>(context: SyncContext<S>, session: Session): void {
  const isPolling = countervaluesSyncIsPollingSelector(context.getState());
  const { refreshRate } = readSettings(context, session);
  if (session.polling?.isPolling === isPolling && session.polling.refreshRate === refreshRate) {
    return;
  }
  clearTimeout(session.pollingTimer);
  session.pollingTimer = undefined;
  session.polling = { isPolling, refreshRate };
  // Re-arming at 0 is a zero-delay self-rescheduling loop, so wait for a real rate.
  if (!isPolling || refreshRate <= 0) return;
  /** Asks for a load, then schedules the next poll. */
  function pollingLoop() {
    tryStep("poll", () => {
      context.dispatch(countervaluesLoadRequested());
    });
    session.pollingTimer = setTimeout(pollingLoop, refreshRate);
  }
  session.pollingTimer = setTimeout(pollingLoop, context.config.pollInitDelay);
}

/**
 * Logs a supported-ids failure once, not on every reconcile while it lasts.
 *
 * @param context
 * The store the sync runs in.
 *
 * @param session
 * The session holding the last error seen.
 */
function logNewSupportedIdsError<S>(context: SyncContext<S>, session: Session): void {
  const { error } = context.readSupportedIds();
  if (error && error !== session.lastSupportedIdsError) {
    log("countervaluesApi", `getCounterValueIdsSortedByMarketCap failed`, { error });
  }
  session.lastSupportedIdsError = error;
}

/**
 * The settings the app computes from the current state, or the ones pinned at start.
 *
 * @param context
 * The store the sync runs in.
 *
 * @param session
 * The session whose selector computes them.
 */
function readSettings<S>(context: SyncContext<S>, session: Session): CountervaluesSettings {
  return session.selectSettings(context.getState() as never);
}

/**
 * The supported crypto ids sorted by market cap, or the bundled list until they load.
 *
 * @param context
 * The store the sync runs in.
 */
function readSupportedIdsOrDefault<S>(context: SyncContext<S>): string[] {
  return context.readSupportedIds().data ?? defaultCounterValueIdsSortedByMarketCap;
}

/**
 * Where the loop stands with loads. Only the middleware reads it, so it stays out of the
 * package's selectors.
 *
 * @param state
 * The store's state.
 */
function readLoad(state: CountervaluesRootState): CountervaluesLoad {
  return state.countervalues.sync.load;
}

/**
 * Reads the supported-ids query from the store the middleware is installed in.
 *
 * @param getState
 * The store's `getState`.
 *
 * @returns
 * A reader backed by the endpoint's memoized selector.
 */
function createSupportedIdsReader(getState: () => unknown): () => SupportedIdsResult {
  const select = supportedIdsEndpoint.select();
  // The endpoint's selector is typed on the API's own root state.
  return () => select(getState() as never);
}

/** How often the supported crypto ids are refetched while a session is open. */
const SUPPORTED_IDS_POLLING_MS = 30 * 60 * 1000;

/** The query of the crypto ids the backend supports, sorted by market cap. */
const supportedIdsEndpoint = marketCountervaluesApi.endpoints.getCounterValueIdsSortedByMarketCap;

/**
 * Whether a tick is queued, and what it will do when it runs.
 *
 * The middleware does not react to each action as it is dispatched. The first action queues a
 * tick, a microtask that runs once the dispatch chain has unwound, and the actions dispatched
 * before it runs only update what it will do. So several actions dispatched together are handled
 * once, after every other middleware has reacted to them.
 *
 * - `none`: no tick is queued; the next action queues one.
 * - `reconcile`: a tick is queued; it will bring the session in line with the store.
 * - `restart`: a tick is queued; it will start the session again from its saved state, because an
 *   action matched `restartOn`. It replaces the reconcile, since a new session starts in line.
 */
export type QueuedTick = "none" | "reconcile" | "restart";

/**
 * The state of the sync for one store.
 *
 * - `idle`: before a start, after a stop and while a session opens. A tick queued before a stop
 *   is still in flight there, as `reconcile`: it finds no session, or reconciles the next one. A
 *   restart cannot be queued without a session to restart.
 * - `running`: a session is open and started.
 */
export type SyncState =
  | { status: "idle"; queuedTick: Exclude<QueuedTick, "restart"> }
  | { status: "running"; session: Session; queuedTick: QueuedTick };

/** The sync state of one store. Only the lifecycle functions below replace `current`. */
export interface SyncStateRef {
  /** The state now; replaced, never mutated. */
  current: SyncState;
}

/** The store and configuration every step works against, built once per store. */
export type SyncContext<S> = {
  /** The store's dispatch, thunks included. */
  dispatch: ThunkDispatch<S, unknown, UnknownAction>;
  /** The store's current state. */
  getState: () => S & CountervaluesRootState;
  /** The supported crypto ids query, as the store currently holds it. */
  readSupportedIds: () => SupportedIdsResult;
  /** The polling controls handed to `subscribeAppEvents`. */
  controls: CountervaluesPollingControls;
  /** The app's configuration. */
  config: SyncConfig<S>;
};

/** The app's configuration with its delays resolved. */
export type SyncConfig<S> = CountervaluesMiddlewareConfig<S> & {
  /** Time to wait after a settings change before reloading. */
  debounceDelay: number;
  /** Time to wait before the first poll after the sync starts. */
  pollInitDelay: number;
};

/**
 * Everything one started sync holds: what it was started with, the resources it acquired and
 * what it last saw of the store. Mutated in place by the steps below; `closeSession` releases it.
 */
export type Session = {
  /** `closed` once released: a timer that fires late does nothing. */
  status: "open" | "closed";
  /** The raw state read from disk, restored at start and again on a restart. */
  savedState: CounterValuesStateRaw | undefined;
  /** Settings pinned by the start payload, kept so a restart pins them again. */
  pinnedSettings: CountervaluesSettings | undefined;
  /** The settings selector created for this session, or one returning the pinned settings. */
  selectSettings: (state: never) => CountervaluesSettings;
  /** Where this session's rates come from. */
  rates: RateSource;
  /** Ends the supported-ids query subscription. */
  unsubscribeSupportedIds: () => void;
  /** Unwires the app's events, once `subscribeAppEvents` has run. */
  unsubscribeAppEvents: (() => void) | undefined;
  /** The inputs and output of the last `readSupportedSettings`, so unchanged inputs give the same object. */
  supportedSettingsMemo: {
    settings: CountervaluesSettings;
    supportedIds: string[];
    value: CountervaluesSettings;
  } | null;
  /** The supported settings last reconciled: a different object starts the reload debounce. */
  lastSupportedSettings: CountervaluesSettings | null;
  /** The pending reload after a settings change. */
  debounceTimer: ReturnType<typeof setTimeout> | undefined;
  /** The polling flag and refresh rate the timer was last armed for, `null` before the first time. */
  polling: { isPolling: boolean; refreshRate: number } | null;
  /** The next poll. */
  pollingTimer: ReturnType<typeof setTimeout> | undefined;
  /** The state last handed to `persist`, or the store's state at start. */
  lastPersisted: CounterValuesState;
  /** The supported-ids error last seen, so the same failure is logged once. */
  lastSupportedIdsError: unknown;
};

/** The part of the store state the sync reads besides the app's own settings. */
type CountervaluesRootState = { countervalues: CountervaluesStoreState };

/** The supported crypto ids query, as far as the sync reads it. */
type SupportedIdsResult = { data?: string[]; error?: unknown };
