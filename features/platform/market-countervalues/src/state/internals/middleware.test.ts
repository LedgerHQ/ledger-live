import type { UnknownAction } from "@reduxjs/toolkit";
import {
  exportCountervalues,
  initialState,
  setCountervaluesState,
  type CountervaluesSettings,
  type TrackingPair,
} from "@domain/entity-market-countervalues";
import { buildCV } from "@domain/entity-market-countervalues/mock";
import type { RateSource } from "@domain/api-market-countervalues";
import type { Currency } from "@domain/entity-currency";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { countervaluesReducer } from "../reducer";
import { countervaluesLoadRequested, countervaluesPollingSet } from "../slice";
import { setCountervaluesLogger } from "../../utils/setCountervaluesLogger";
import {
  cancelRestart,
  closeSession,
  createPollingControls,
  debounceReload,
  initialSyncState,
  nextQueuedTick,
  onAction,
  persistNewRates,
  readSupportedSettings,
  restoreSavedState,
  shouldBatchCurrency,
  stopSync,
  tryStep,
  type QueuedTick,
  type Session,
  type SyncContext,
  type SyncStateRef,
} from "./middleware";

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");
const usd = getFiatCurrencyByTicker("USD");

function trackingPair(from: Currency): TrackingPair {
  return { from, to: usd, startDate: new Date("2026-06-19T00:00:00.000Z") };
}

function settingsWith(trackingPairs: TrackingPair[]): CountervaluesSettings {
  return { trackingPairs, autofillGaps: true, refreshRate: 60_000, marketCapBatchingAfterRank: 20 };
}

function createContext({
  settings = settingsWith([trackingPair(bitcoin)]),
  supportedIds,
  persist,
  restartOn,
}: {
  settings?: CountervaluesSettings;
  supportedIds?: string[];
  persist?: SyncContext<unknown>["config"]["persist"];
  restartOn?: SyncContext<unknown>["config"]["restartOn"];
} = {}) {
  const dispatched: UnknownAction[] = [];
  const store = {
    countervalues: countervaluesReducer(undefined, { type: "init" }),
    settings,
    supportedIds: { data: supportedIds },
  };
  const context: SyncContext<unknown> = {
    dispatch: ((action: UnknownAction) => {
      dispatched.push(action);
      return action;
    }) as SyncContext<unknown>["dispatch"],
    getState: () => store,
    readSupportedIds: () => store.supportedIds,
    controls: { poll() {}, start() {}, stop() {} },
    config: {
      createSettingsSelector: () => state => (state as typeof store).settings,
      createRates: () => ({}) as RateSource,
      persist,
      restartOn,
      debounceDelay: 1000,
      pollInitDelay: 3000,
    },
  };
  return { context, store, dispatched };
}

function createSession(overrides: Partial<Session> = {}): Session {
  return {
    status: "open",
    savedState: undefined,
    pinnedSettings: undefined,
    selectSettings: state => (state as { settings: CountervaluesSettings }).settings,
    rates: {} as RateSource,
    unsubscribeSupportedIds: () => {},
    unsubscribeAppEvents: undefined,
    supportedSettingsMemo: null,
    lastSupportedSettings: null,
    debounceTimer: undefined,
    polling: null,
    pollingTimer: undefined,
    lastPersisted: initialState,
    lastSupportedIdsError: undefined,
    ...overrides,
  };
}

describe("tryStep", () => {
  afterEach(() => setCountervaluesLogger(() => {}));

  it("logs a failing step instead of throwing", () => {
    const logs: string[] = [];
    setCountervaluesLogger((type, message) => logs.push(`${type}: ${message}`));

    expect(() =>
      tryStep("reload", () => {
        throw new Error("boom");
      }),
    ).not.toThrow();
    expect(logs).toEqual(["countervalues: sync reload failed"]);
  });

  it("does not throw when the logger itself fails", () => {
    setCountervaluesLogger(() => {
      throw new Error("logger down");
    });

    expect(() =>
      tryStep("reload", () => {
        throw new Error("boom");
      }),
    ).not.toThrow();
  });
});

describe("createPollingControls", () => {
  it("dispatches the slice's polling actions", () => {
    const dispatched: UnknownAction[] = [];
    const controls = createPollingControls(action => dispatched.push(action));

    controls.poll();
    controls.start();
    controls.stop();

    expect(dispatched).toEqual([
      countervaluesLoadRequested(),
      countervaluesPollingSet(true),
      countervaluesPollingSet(false),
    ]);
  });
});

describe("readSupportedSettings", () => {
  it("drops the pairs the supported ids do not list", () => {
    const { context } = createContext({
      settings: settingsWith([trackingPair(bitcoin), trackingPair(ethereum)]),
      supportedIds: ["bitcoin"],
    });

    const { trackingPairs } = readSupportedSettings(context, createSession());

    expect(trackingPairs).toEqual([trackingPair(bitcoin)]);
  });

  it("returns the same object while neither input changes, and a new one when one does", () => {
    const { context, store } = createContext({ supportedIds: ["bitcoin"] });
    const session = createSession();

    const first = readSupportedSettings(context, session);
    expect(readSupportedSettings(context, session)).toBe(first);

    store.supportedIds = { data: ["bitcoin", "ethereum"] };
    const afterIds = readSupportedSettings(context, session);
    expect(afterIds).not.toBe(first);

    store.settings = { ...store.settings };
    expect(readSupportedSettings(context, session)).not.toBe(afterIds);
  });
});

describe("shouldBatchCurrency", () => {
  const supportedIds = ["bitcoin", "ethereum"];

  it("never batches a fiat", () => {
    expect(shouldBatchCurrency(usd, [], 0)).toBe(false);
  });

  it("batches a crypto ranked below the limit or not ranked at all", () => {
    expect(shouldBatchCurrency(bitcoin, supportedIds, 0)).toBe(false);
    expect(shouldBatchCurrency(ethereum, supportedIds, 0)).toBe(true);
    expect(shouldBatchCurrency(ethereum, ["bitcoin"], 20)).toBe(true);
  });
});

describe("restoreSavedState", () => {
  it("skips an absent or empty snapshot", () => {
    const { context, dispatched } = createContext();
    const settings = settingsWith([trackingPair(bitcoin)]);

    restoreSavedState(context, undefined, settings);
    restoreSavedState(context, {} as never, settings);

    expect(dispatched).toEqual([]);
  });

  it("puts a saved snapshot in the store", () => {
    const { context, dispatched } = createContext();
    const pairs = [trackingPair(bitcoin)];
    const savedState = exportCountervalues(
      buildCV({ pair: { from: bitcoin, to: usd }, latest: 30_000 }),
      pairs,
    );

    restoreSavedState(context, savedState, settingsWith(pairs));

    expect(dispatched.map(action => action.type)).toEqual([setCountervaluesState.type]);
  });
});

describe("debounceReload", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("asks for one load once the calls stop for the delay", () => {
    const { context, dispatched } = createContext();
    const session = createSession();

    debounceReload(context, session);
    jest.advanceTimersByTime(900);
    debounceReload(context, session);
    jest.advanceTimersByTime(900);
    expect(dispatched).toEqual([]);

    jest.advanceTimersByTime(100);
    expect(dispatched).toEqual([countervaluesLoadRequested()]);
  });

  it("asks for nothing once the session is closed", () => {
    const { context, dispatched } = createContext();
    const session = createSession();

    debounceReload(context, session);
    closeSession(session);
    jest.advanceTimersByTime(1000);

    expect(session.status).toBe("closed");
    expect(dispatched).toEqual([]);
  });
});

describe("persistNewRates", () => {
  it("saves nothing while the state has no new rates", () => {
    const persist = jest.fn();
    const { context } = createContext({ persist });

    persistNewRates(
      context,
      createSession({ lastPersisted: context.getState().countervalues.rates }),
    );

    expect(persist).not.toHaveBeenCalled();
  });

  it("saves new rates once", () => {
    const persist = jest.fn();
    const { context, store } = createContext({ persist });
    const session = createSession();
    store.countervalues = {
      ...store.countervalues,
      rates: buildCV({ pair: { from: bitcoin, to: usd }, latest: 30_000 }),
    };

    persistNewRates(context, session);
    persistNewRates(context, session);

    expect(persist).toHaveBeenCalledTimes(1);
    expect(session.lastPersisted).toBe(store.countervalues.rates);
  });
});

describe("initialSyncState", () => {
  it("is idle with no tick queued", () => {
    expect(initialSyncState).toEqual({ status: "idle", queuedTick: "none" });
  });
});

describe("nextQueuedTick", () => {
  it.each<[QueuedTick, boolean, QueuedTick]>([
    // The first action of the tick queues it.
    ["none", false, "reconcile"],
    ["none", true, "restart"],
    // The next ones only change what it will do: a restart wins, and stays.
    ["reconcile", false, "reconcile"],
    ["reconcile", true, "restart"],
    ["restart", false, "restart"],
    ["restart", true, "restart"],
  ])("%s, then an action with restart %s: %s", (queuedTick, restart, expected) => {
    expect(nextQueuedTick(queuedTick, restart)).toBe(expected);
  });
});

describe("cancelRestart", () => {
  it.each<[QueuedTick, QueuedTick]>([
    ["none", "none"],
    ["reconcile", "reconcile"],
    // The tick stays queued: it reconciles whatever session runs when it fires.
    ["restart", "reconcile"],
  ])("%s: %s", (queuedTick, expected) => {
    expect(cancelRestart(queuedTick)).toBe(expected);
  });
});

describe("stopSync", () => {
  it("goes idle before closing the session, so the closing dispatches queue no tick", () => {
    const seen: string[] = [];
    const ref: SyncStateRef = { current: initialSyncState };
    const session = createSession({
      unsubscribeSupportedIds: () => seen.push(ref.current.status),
    });
    ref.current = { status: "running", session, queuedTick: "none" };

    stopSync(ref);

    expect(seen).toEqual(["idle"]);
    expect(session.status).toBe("closed");
  });

  it("cancels a restart asked for in the same tick, and keeps the tick queued", () => {
    const ref: SyncStateRef = {
      current: { status: "running", session: createSession(), queuedTick: "restart" },
    };

    stopSync(ref);

    expect(ref.current).toEqual({ status: "idle", queuedTick: "reconcile" });
  });
});

describe("onAction", () => {
  // A reconcile may arm the polling timer.
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("ignores actions while idle, without asking restartOn", () => {
    const restartOn = jest.fn(() => true);
    const { context } = createContext({ restartOn });
    const ref: SyncStateRef = { current: initialSyncState };

    onAction(context, ref, { type: "test/unrelated" });

    expect(ref.current).toBe(initialSyncState);
    expect(restartOn).not.toHaveBeenCalled();
  });

  it("queues one tick for the actions of a tick, then reconciles once", async () => {
    const { context } = createContext();
    const readSupportedIds = jest.spyOn(context, "readSupportedIds");
    const ref: SyncStateRef = {
      current: { status: "running", session: createSession(), queuedTick: "none" },
    };

    onAction(context, ref, { type: "test/a" });
    onAction(context, ref, { type: "test/b" });
    expect(ref.current.queuedTick).toBe("reconcile");
    expect(readSupportedIds).not.toHaveBeenCalled();

    await Promise.resolve();

    expect(ref.current.queuedTick).toBe("none");
    // A reconcile reads the supported ids: once for the error, once per supported-settings read.
    const reads = readSupportedIds.mock.calls.length;
    expect(reads).toBeGreaterThan(0);
    await Promise.resolve();
    expect(readSupportedIds).toHaveBeenCalledTimes(reads);
  });
});
