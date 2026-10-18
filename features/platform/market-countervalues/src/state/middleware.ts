import {
  createAction,
  isAction,
  type Middleware,
  type ThunkDispatch,
  type UnknownAction,
} from "@reduxjs/toolkit";
import type {
  CounterValuesStateRaw,
  CountervaluesSettings,
} from "@domain/entity-market-countervalues";
import type { RateSource } from "@domain/api-market-countervalues";
import {
  createSyncContext,
  initialSyncState,
  onAction,
  startSync,
  stopSync,
  tryStep,
  type SyncStateRef,
} from "./internals/middleware";

// The countervalues loop as a Redux middleware: it restores the saved state, loads rates when the
// settings or the supported ids change, when a poll is asked for and on a timer, and nothing runs
// until `startCountervaluesSync` is dispatched.

/** The polling controls handed to `subscribeAppEvents`; they dispatch the slice's polling actions. */
export interface CountervaluesPollingControls {
  /** Asks for a load now, or once the pending one lands. */
  poll(): void;
  /** Resumes the polling timer. */
  start(): void;
  /** Pauses the polling timer; asked-for loads still run. */
  stop(): void;
}

/** What only the app knows, given to {@link createCountervaluesMiddleware} at store creation. */
export interface CountervaluesMiddlewareConfig<S> {
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
}

/** What {@link startCountervaluesSync} starts from. */
export interface StartCountervaluesSyncPayload {
  /** The raw state read from disk, restored once per start. Never kept in the store. */
  savedState?: CounterValuesStateRaw;
  /** Pins the settings instead of using `createSettingsSelector`, for test wrappers. */
  settings?: CountervaluesSettings;
}

/**
 * Starts the sync, or starts it again from scratch if it runs: restores `savedState`, loads, and
 * keeps loading until {@link stopCountervaluesSync}.
 */
export const startCountervaluesSync = createAction<StartCountervaluesSyncPayload | undefined>(
  "countervaluesSync/start",
);
/** Stops the sync: timers and subscriptions end, and a load in flight still lands. */
export const stopCountervaluesSync = createAction("countervaluesSync/stop");

/**
 * Creates the middleware running the countervalues sync for one store.
 *
 * It is inert until `startCountervaluesSync`. A start opens a session: it restores the saved state
 * once, asks for a first load and arms the polling timer. Then, after every action, one reconcile
 * per tick brings the session in line with the store: a settings change debounces a reload, an
 * asked-for load runs when none is pending, and new rates are persisted. `stopCountervaluesSync`
 * closes the session, and an action matching `restartOn` starts a new one from the same saved
 * state once its dispatch has settled.
 *
 * The body only wires the store to `./internals/middleware`: it builds the store's
 * context and sync state, and hands each action to the lifecycle function for it. None of them
 * throws into a `dispatch`.
 */
export function createCountervaluesMiddleware<S>(
  config: CountervaluesMiddlewareConfig<S>,
): Middleware<object, S> {
  return api => {
    const context = createSyncContext(api, config);
    const ref: SyncStateRef = { current: initialSyncState };
    return next => action => {
      const result = next(action);
      if (!isAction(action)) return result;
      if (startCountervaluesSync.match(action)) {
        const payload = action.payload ?? {};
        tryStep("start", () => startSync(context, ref, payload));
      } else if (stopCountervaluesSync.match(action)) {
        tryStep("stop", () => stopSync(ref));
      } else {
        tryStep("action", () => onAction(context, ref, action));
      }
      return result;
    };
  };
}
