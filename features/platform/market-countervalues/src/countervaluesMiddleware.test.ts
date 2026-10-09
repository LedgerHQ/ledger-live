import {
  configureStore,
  createAction,
  createReducer,
  type Middleware,
  type UnknownAction,
} from "@reduxjs/toolkit";
import {
  exportCountervalues,
  initialState,
  type CounterValuesState,
  type CountervaluesSettings,
  type TrackingPair,
} from "@domain/entity-market-countervalues";
import { buildCV } from "@domain/entity-market-countervalues/mock";
import { loadCountervalues, type RateSource } from "@domain/api-market-countervalues";
import type { Currency } from "@domain/entity-currency";
import { CryptoCurrencyIdSchema, getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { TokenCurrencyIdSchema, type TokenCurrency } from "@domain/entity-currency-token";
import {
  countervaluesReducer,
  setCountervaluesPollingIsPolling,
  setCountervaluesPollingTriggerLoad,
  setCountervaluesState,
  setCountervaluesStateError,
  setCountervaluesStatePending,
  wipeCountervalues,
} from "./countervaluesSlice";
import {
  createCountervaluesMiddleware,
  startCountervaluesSync,
  stopCountervaluesSync,
  type CountervaluesMiddlewareConfig,
} from "./countervaluesMiddleware";
import { setCountervaluesLogger } from "./setCountervaluesLogger";

jest.mock("@domain/api-market-countervalues", () => {
  const actual = jest.requireActual("@domain/api-market-countervalues");
  return {
    ...actual,
    loadCountervalues: jest.fn(),
    // The supported ids come from a test reducer instead of the network.
    marketCountervaluesApi: {
      endpoints: {
        getCounterValueIdsSortedByMarketCap: {
          initiate: () => () => {
            mockSupportedIdsSubscriptions.active++;
            return {
              unsubscribe: () => {
                mockSupportedIdsSubscriptions.active--;
              },
            };
          },
          select: () => (state: { supportedIds: { data?: string[]; error?: unknown } }) =>
            state.supportedIds,
        },
      },
    },
  };
});

const mockSupportedIdsSubscriptions = { active: 0 };

const bitcoin = getCryptoCurrencyById("bitcoin");
const usd = getFiatCurrencyByTicker("USD");
const mockLoadCountervalues = jest.mocked(loadCountervalues);

// The middleware only forwards this; loadCountervalues is mocked.
const rates: RateSource = { fetchHistorical: jest.fn(), fetchLatest: jest.fn() };

const setSettings = createAction<CountervaluesSettings>("test/setSettings");
const setSupportedIds = createAction<{ data?: string[]; error?: unknown }>("test/setSupportedIds");
const reboot = createAction("test/reboot");
const unrelated = createAction("test/unrelated");

function trackingPair(from: Currency): TrackingPair {
  return { from, to: usd, startDate: new Date("2026-06-19T00:00:00.000Z") };
}

function settingsWith({
  trackingPairs = [trackingPair(bitcoin)],
  refreshRate = 60_000,
}: { trackingPairs?: TrackingPair[]; refreshRate?: number } = {}): CountervaluesSettings {
  return { trackingPairs, autofillGaps: true, refreshRate, marketCapBatchingAfterRank: 20 };
}

type Options = {
  settings?: CountervaluesSettings;
  supportedIds?: string[];
  isPolling?: boolean;
} & Partial<
  Pick<CountervaluesMiddlewareConfig<unknown>, "persist" | "restartOn" | "subscribeAppEvents">
>;

function createTestStore({
  settings = settingsWith(),
  supportedIds,
  isPolling = false,
  ...config
}: Options = {}) {
  const dispatched: UnknownAction[] = [];
  const record: Middleware = () => next => action => {
    dispatched.push(action as UnknownAction);
    return next(action);
  };
  // Mirrors the mobile reboot middleware: the wipe follows the reboot in the same tick.
  const wipeOnReboot: Middleware = api => next => action => {
    const result = next(action);
    if (reboot.match(action)) api.dispatch(wipeCountervalues());
    return result;
  };
  const selectSettings = jest.fn((state: { settings: CountervaluesSettings }) => state.settings);
  const createSettingsSelector = jest.fn(() => selectSettings);
  const store = configureStore({
    reducer: {
      countervalues: countervaluesReducer,
      settings: createReducer(settings, b => b.addCase(setSettings, (_, a) => a.payload)),
      supportedIds: createReducer<{ data?: string[]; error?: unknown }>(
        supportedIds ? { data: supportedIds } : {},
        b => b.addCase(setSupportedIds, (_, a) => a.payload),
      ),
    },
    preloadedState: {
      countervalues: {
        ...countervaluesReducer(undefined, { type: "init" }),
        polling: { isPolling, triggerLoad: false },
      },
    },
    // The state holds an Error and rate Maps.
    middleware: getDefault =>
      getDefault({ serializableCheck: false, immutableCheck: false }).concat(
        record,
        wipeOnReboot,
        createCountervaluesMiddleware({
          createSettingsSelector,
          createRates: () => rates,
          ...config,
        }),
      ),
  });
  return { store, dispatched, selectSettings, createSettingsSelector };
}

// Lets the middleware's pass and the load promises run.
async function flush() {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}

function loads() {
  return mockLoadCountervalues.mock.calls.length;
}

function types(dispatched: UnknownAction[]) {
  return dispatched.map(a => a.type);
}

describe("createCountervaluesMiddleware", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockSupportedIdsSubscriptions.active = 0;
    mockLoadCountervalues.mockImplementation(state => Promise.resolve(state));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does nothing until started", async () => {
    const { store, dispatched, selectSettings } = createTestStore({ isPolling: true });

    store.dispatch(unrelated());
    await flush();
    jest.advanceTimersByTime(120_000);
    await flush();

    expect(types(dispatched)).toEqual(["test/unrelated"]);
    expect(selectSettings).not.toHaveBeenCalled();
    expect(mockSupportedIdsSubscriptions.active).toBe(0);
    expect(loads()).toBe(0);
  });

  it("restores the saved state, then loads from it", async () => {
    const state = buildCV({ pair: { from: bitcoin, to: usd }, latest: 30_000 });
    const savedState = exportCountervalues(state, [trackingPair(bitcoin)]);
    const { store, dispatched } = createTestStore();

    store.dispatch(startCountervaluesSync({ savedState }));
    await flush();

    expect(types(dispatched)).toEqual([
      "countervaluesSync/start",
      setCountervaluesPollingTriggerLoad.type,
      setCountervaluesState.type,
      setCountervaluesPollingTriggerLoad.type,
      setCountervaluesStatePending.type,
      setCountervaluesState.type,
      setCountervaluesStatePending.type,
    ]);
    const restored = dispatched.filter(setCountervaluesState.match)[0].payload;
    expect(restored.checkHolesOnNextLoad).toBe(true);
    expect(mockLoadCountervalues).toHaveBeenCalledTimes(1);
    expect(mockLoadCountervalues.mock.calls[0][0]).toBe(restored);
  });

  it("filters unsupported tracking pairs before loading when supported crypto ids are loaded", async () => {
    const unsupportedToken: TokenCurrency = {
      type: "TokenCurrency",
      id: TokenCurrencyIdSchema.parse(
        "ethereum/erc20/lc_staked_shared_eth_0xc4dcb059dd98b45b090da8982234c61d0b9e84f9",
      ),
      contractAddress: "0xc4dcb059dd98b45b090da8982234c61d0b9e84f9",
      parentCurrencyId: CryptoCurrencyIdSchema.parse("ethereum"),
      tokenType: "erc20",
      name: "Ledger Staked Shared ETH",
      ticker: "osETH",
      delisted: false,
      disableCountervalue: false,
      units: [{ name: "osETH", code: "osETH", magnitude: 18 }],
    };
    const supportedPair = trackingPair(bitcoin);
    const trackingPairs = [supportedPair, trackingPair(unsupportedToken)];

    const loaded = createTestStore({
      settings: settingsWith({ trackingPairs }),
      supportedIds: [bitcoin.id],
    });
    loaded.store.dispatch(startCountervaluesSync());
    await flush();
    expect(mockLoadCountervalues.mock.calls[0][1].trackingPairs).toEqual([supportedPair]);

    mockLoadCountervalues.mockClear();
    const notLoaded = createTestStore({ settings: settingsWith({ trackingPairs }) });
    notLoaded.store.dispatch(startCountervaluesSync());
    await flush();
    expect(mockLoadCountervalues.mock.calls[0][1].trackingPairs).toBe(trackingPairs);
  });

  it("uses the same API-ID lookup in filter and batching for remapped currencies", async () => {
    // assethub_polkadot maps to "polkadot" via inferCurrencyAPIID.
    const assethubPolkadot: Currency = {
      ...bitcoin,
      id: CryptoCurrencyIdSchema.parse("assethub_polkadot"),
      name: "Asset Hub Polkadot",
      ticker: "DOT",
    };
    const { store } = createTestStore({
      settings: settingsWith({ trackingPairs: [trackingPair(assethubPolkadot)] }),
      supportedIds: ["polkadot"],
    });

    store.dispatch(startCountervaluesSync());
    await flush();

    expect(mockLoadCountervalues.mock.calls[0][1].trackingPairs).toHaveLength(1);
    expect(
      mockLoadCountervalues.mock.calls[0][2]?.batchStrategySolver?.shouldBatchCurrencyFrom(
        assethubPolkadot,
      ),
    ).toBe(false);
  });

  it("releases pending and reports the error when a load fails, so polling can resume", async () => {
    const failure = new Error("countervalues service unreachable");
    mockLoadCountervalues.mockRejectedValue(failure);
    const { store, dispatched } = createTestStore();

    store.dispatch(startCountervaluesSync());
    await flush();

    expect(dispatched.filter(setCountervaluesStateError.match).map(a => a.payload)).toEqual([
      failure,
    ]);
    expect(dispatched.filter(setCountervaluesStatePending.match).at(-1)?.payload).toBe(false);
    expect(dispatched.filter(setCountervaluesState.match)).toHaveLength(0);
  });

  it("passes the app's rate source and a logger to loadCountervalues", async () => {
    const { store } = createTestStore();

    store.dispatch(startCountervaluesSync());
    await flush();

    expect(mockLoadCountervalues.mock.calls[0][2]?.rates).toBe(rates);
    expect(mockLoadCountervalues.mock.calls[0][2]?.log).toEqual(expect.any(Function));
  });

  it("asks for a load after the initial delay, then at every refresh", async () => {
    const { store } = createTestStore({ isPolling: true });
    store.dispatch(startCountervaluesSync());
    await flush();
    expect(loads()).toBe(1);

    jest.advanceTimersByTime(2_999);
    await flush();
    expect(loads()).toBe(1);
    jest.advanceTimersByTime(1);
    await flush();
    expect(loads()).toBe(2);
    jest.advanceTimersByTime(60_000);
    await flush();
    expect(loads()).toBe(3);
  });

  it("does not poll before a refresh rate arrives", async () => {
    const { store } = createTestStore({
      isPolling: true,
      settings: settingsWith({ refreshRate: 0 }),
    });
    store.dispatch(startCountervaluesSync());
    await flush();

    jest.advanceTimersByTime(120_000);
    await flush();

    expect(loads()).toBe(1);
  });

  it("re-arms the timer when polling stops and starts", async () => {
    const { store } = createTestStore({ isPolling: true });
    store.dispatch(startCountervaluesSync());
    await flush();

    store.dispatch(setCountervaluesPollingIsPolling(false));
    await flush();
    jest.advanceTimersByTime(120_000);
    await flush();
    expect(loads()).toBe(1);

    store.dispatch(setCountervaluesPollingIsPolling(true));
    await flush();
    jest.advanceTimersByTime(3_000);
    await flush();
    expect(loads()).toBe(2);
  });

  it("defers a poll asked for while a load is pending", async () => {
    let settle: (s: CounterValuesState) => void = () => {};
    const { store } = createTestStore();
    store.dispatch(startCountervaluesSync());
    await flush();
    mockLoadCountervalues.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          settle = resolve;
        }),
    );

    store.dispatch(setCountervaluesPollingTriggerLoad(true));
    await flush();
    store.dispatch(setCountervaluesPollingTriggerLoad(true));
    await flush();
    expect(loads()).toBe(2);

    settle(initialState);
    await flush();
    expect(loads()).toBe(3);
  });

  it("reloads once, after the debounce, when the settings change, without restoring again", async () => {
    const savedState = exportCountervalues(
      buildCV({ pair: { from: bitcoin, to: usd }, latest: 30_000 }),
      [trackingPair(bitcoin)],
    );
    const { store, dispatched } = createTestStore();
    store.dispatch(startCountervaluesSync({ savedState }));
    await flush();
    const restoresAtStart = dispatched.filter(setCountervaluesState.match).length;

    store.dispatch(setSettings(settingsWith({ refreshRate: 60_000 })));
    await flush();
    jest.advanceTimersByTime(999);
    await flush();
    expect(loads()).toBe(1);
    jest.advanceTimersByTime(1);
    await flush();

    expect(loads()).toBe(2);
    // One STATE_SET per load, none for a restore.
    expect(dispatched.filter(setCountervaluesState.match)).toHaveLength(restoresAtStart + 1);
  });

  it("reloads once for several settings changes, in one tick or inside the debounce", async () => {
    const { store } = createTestStore();
    store.dispatch(startCountervaluesSync());
    await flush();

    store.dispatch(setSettings(settingsWith()));
    store.dispatch(setSettings(settingsWith()));
    store.dispatch(setSettings(settingsWith()));
    await flush();
    jest.advanceTimersByTime(500);
    store.dispatch(setSettings(settingsWith()));
    await flush();
    jest.advanceTimersByTime(1_000);
    await flush();

    expect(loads()).toBe(2);
  });

  it("does not reload when the settings object is unchanged", async () => {
    const { store } = createTestStore();
    store.dispatch(startCountervaluesSync());
    await flush();

    store.dispatch(unrelated());
    await flush();
    jest.advanceTimersByTime(5_000);
    await flush();

    expect(loads()).toBe(1);
  });

  it("stops: timers and subscriptions end, and a load in flight still lands", async () => {
    let settle: (s: CounterValuesState) => void = () => {};
    mockLoadCountervalues.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          settle = resolve;
        }),
    );
    const unsubscribe = jest.fn();
    const { store, dispatched } = createTestStore({
      isPolling: true,
      subscribeAppEvents: () => unsubscribe,
    });
    store.dispatch(startCountervaluesSync());
    await flush();
    expect(mockSupportedIdsSubscriptions.active).toBe(1);

    store.dispatch(stopCountervaluesSync());
    settle(initialState);
    await flush();
    jest.advanceTimersByTime(120_000);
    await flush();

    expect(mockSupportedIdsSubscriptions.active).toBe(0);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(loads()).toBe(1);
    expect(dispatched.filter(setCountervaluesStatePending.match).at(-1)?.payload).toBe(false);
  });

  it("hands polling controls to the app's event subscription", async () => {
    let controls: { poll(): void; start(): void; stop(): void } | undefined;
    const { store } = createTestStore({
      subscribeAppEvents: c => {
        controls = c;
        return () => {};
      },
    });
    store.dispatch(startCountervaluesSync());
    await flush();

    controls?.stop();
    expect(store.getState().countervalues.polling.isPolling).toBe(false);
    controls?.start();
    expect(store.getState().countervalues.polling.isPolling).toBe(true);
    controls?.poll();
    await flush();
    expect(loads()).toBe(2);
  });

  it("restarts after the dispatch that asked for it: wipe, then restore, then load", async () => {
    const savedState = exportCountervalues(
      buildCV({ pair: { from: bitcoin, to: usd }, latest: 30_000 }),
      [trackingPair(bitcoin)],
    );
    const { store, dispatched } = createTestStore({ restartOn: reboot.match });
    store.dispatch(startCountervaluesSync({ savedState }));
    await flush();
    dispatched.length = 0;

    store.dispatch(reboot());
    await flush();

    expect(types(dispatched)).toEqual([
      "test/reboot",
      wipeCountervalues.type,
      setCountervaluesPollingTriggerLoad.type,
      setCountervaluesState.type,
      setCountervaluesPollingTriggerLoad.type,
      setCountervaluesStatePending.type,
      setCountervaluesState.type,
      setCountervaluesStatePending.type,
    ]);
    const restored = dispatched.filter(setCountervaluesState.match)[0].payload;
    expect(Object.keys(restored.data)).toEqual(Object.keys(savedState).filter(k => k !== "status"));
    expect(mockLoadCountervalues.mock.lastCall?.[0]).toBe(restored);
  });

  it("persists new rates to export, and nothing otherwise", async () => {
    const persist = jest.fn();
    const savedState = exportCountervalues(
      buildCV({ pair: { from: bitcoin, to: usd }, latest: 30_000 }),
      [trackingPair(bitcoin)],
    );
    const { store } = createTestStore({ persist });
    store.dispatch(startCountervaluesSync({ savedState }));
    await flush();
    const saves = persist.mock.calls.length;
    expect(saves).toBeGreaterThan(0);

    store.dispatch(unrelated());
    await flush();

    expect(persist).toHaveBeenCalledTimes(saves);
  });

  it("creates a fresh settings selector on each start", async () => {
    const { store, createSettingsSelector } = createTestStore();

    store.dispatch(startCountervaluesSync());
    store.dispatch(stopCountervaluesSync());
    store.dispatch(startCountervaluesSync());
    await flush();

    expect(createSettingsSelector).toHaveBeenCalledTimes(2);
  });

  it("keeps two stores independent", async () => {
    const first = createTestStore({ isPolling: true });
    const second = createTestStore({ isPolling: true });
    first.store.dispatch(startCountervaluesSync());
    await flush();

    jest.advanceTimersByTime(3_000);
    await flush();

    expect(loads()).toBe(2);
    expect(second.dispatched).toHaveLength(0);
  });

  it("never throws into the dispatch that triggered a failing step", async () => {
    const logs: string[] = [];
    setCountervaluesLogger((type, message) => logs.push(`${type}: ${message}`));
    const { store, selectSettings } = createTestStore();
    selectSettings.mockImplementation(() => {
      throw new Error("settings computation failed");
    });

    expect(() => store.dispatch(startCountervaluesSync())).not.toThrow();
    await flush();

    expect(loads()).toBe(0);
    expect(mockSupportedIdsSubscriptions.active).toBe(0);
    expect(logs).toEqual(["countervalues: sync start failed"]);
    setCountervaluesLogger(() => {});
  });

  it("logs a supported-ids failure once", async () => {
    const logs: string[] = [];
    setCountervaluesLogger((type, message) => logs.push(`${type}: ${message}`));
    const { store } = createTestStore();
    store.dispatch(startCountervaluesSync());
    await flush();

    const error = { status: 500 };
    store.dispatch(setSupportedIds({ error }));
    await flush();
    store.dispatch(unrelated());
    await flush();

    expect(logs.filter(l => l.startsWith("countervaluesApi"))).toHaveLength(1);
    setCountervaluesLogger(() => {});
  });
});
