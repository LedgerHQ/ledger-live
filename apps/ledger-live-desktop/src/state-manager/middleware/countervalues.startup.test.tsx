import { loadCountervalues } from "@domain/api-market-countervalues";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import {
  exportCountervalues,
  importCountervalues,
  pairId,
  type CounterValuesStateRaw,
} from "@domain/entity-market-countervalues";
import {
  startCountervaluesSync,
  useCountervaluesState,
} from "@features/platform-market-countervalues";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { act, render } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { addExtraTrackingPairs } from "~/renderer/reducers/countervaluesExtraTracking";
import dbMiddleware from "~/renderer/middlewares/db";
import type { State } from "~/renderer/reducers";
import createStore from "~/state-manager/configureStore";
import { appCountervaluesSources } from "./countervalues";

// The supported ids are read inside the platform package, so they are pinned at the query.
jest.mock("@domain/api-market-countervalues", () => {
  const actual = jest.requireActual("@domain/api-market-countervalues");
  const endpoint = actual.marketCountervaluesApi.endpoints.getCounterValueIdsSortedByMarketCap;
  return {
    ...actual,
    loadCountervalues: jest.fn(),
    marketCountervaluesApi: {
      ...actual.marketCountervaluesApi,
      endpoints: {
        ...actual.marketCountervaluesApi.endpoints,
        getCounterValueIdsSortedByMarketCap: {
          ...endpoint,
          initiate: () => () => ({ unsubscribe: () => {} }),
          select: () => () => ({ data: mockSupportedCryptoIds }),
        },
      },
    },
  };
});

jest.mock("@domain/entity-market-countervalues", () => {
  const actual = jest.requireActual("@domain/entity-market-countervalues");
  return { ...actual, importCountervalues: jest.fn(actual.importCountervalues) };
});

jest.mock("~/renderer/storage", () => ({
  ...jest.requireActual("~/renderer/storage"),
  setKey: (namespace: string, key: string, value: CounterValuesStateRaw) =>
    mockSetKey(namespace, key, value),
}));

const mockSupportedCryptoIds = ["bitcoin", "ethereum"];
const mockSetKey = jest.fn<void, [string, string, CounterValuesStateRaw]>();

const bitcoin = getCryptoCurrencyById("bitcoin");
const usd = getFiatCurrencyByTicker("USD");
const BTC_USD = pairId({ from: bitcoin, to: usd });

// What the previous session saved to disk for the user's bitcoin account.
const savedState = exportCountervalues(
  {
    data: {
      [BTC_USD]: new Map([
        ["2026-10-05", 61_000],
        ["2026-10-06", 62_000],
        ["2026-10-07", 63_000],
      ]),
    },
    status: { [BTC_USD]: { timestamp: Date.parse("2026-10-07T12:00:00Z") } },
    cache: {},
  },
  [{ from: bitcoin, to: usd, startDate: new Date("2026-09-01") }],
);

// The first poll tick fires at the default pollInitDelay (3s): stop just before it.
const BOOT_WINDOW_MS = 2_999;
// Past the first poll tick, then the settings debounce (1s), well before the next tick.
const AFTER_FIRST_POLL_MS = 3_500;
const AFTER_DEBOUNCE_MS = 1_500;

function countervaluesSaves(): CounterValuesStateRaw[] {
  return mockSetKey.mock.calls
    .filter(([namespace, key]) => namespace === "app" && key === "countervalues")
    .map(([, , value]) => value);
}

function createTestStore(accountId: string) {
  return createStore({
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    state: { accounts: [genAccount(accountId, { currency: bitcoin })] } as State,
    dbMiddleware,
    fetchRemoteFlags: null,
    countervalues: appCountervaluesSources,
  });
}

async function advance(ms: number) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
}

describe("countervalues sync at startup", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-08T12:00:00Z") });
    jest.mocked(loadCountervalues).mockImplementation(state => Promise.resolve(state));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("restores and loads once with the account pairs, then saves the restored rates", async () => {
    const store = createTestStore("countervalues-startup-btc");

    store.dispatch(startCountervaluesSync({ savedState }));
    await advance(BOOT_WINDOW_MS);

    const boot = {
      restores: jest.mocked(importCountervalues).mock.calls.length,
      loadedPairs: jest
        .mocked(loadCountervalues)
        .mock.calls.map(([, settings]) => settings.trackingPairs.map(pairId)),
      savedKeys: countervaluesSaves().map(Object.keys),
      restoredPairs: Object.keys(store.getState().countervalues.countervalues.state.data),
    };

    expect(boot).toEqual({
      restores: 1,
      loadedPairs: [[BTC_USD]],
      savedKeys: [["status", BTC_USD]],
      restoredPairs: [BTC_USD],
    });
  });
});

describe("countervalues sync on a settings change", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-08T12:00:00Z") });
    jest.mocked(loadCountervalues).mockImplementation(state => Promise.resolve(state));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Without a context, a component reading the state re-renders only when the state changes.
  it("does not re-render a component that only reads the countervalues state", async () => {
    const store = createTestStore("countervalues-rerender-btc");
    const reads = { renders: 0, unchanged: 0 };
    let previous: unknown;
    function StateReader() {
      const state = useCountervaluesState();
      if (reads.renders > 0 && state === previous) reads.unchanged++;
      reads.renders++;
      previous = state;
      return null;
    }

    store.dispatch(startCountervaluesSync({ savedState }));
    render(
      <Provider store={store}>
        <StateReader />
      </Provider>,
    );
    await advance(AFTER_FIRST_POLL_MS);
    const restoresAtBoot = jest.mocked(importCountervalues).mock.calls.length;
    const loadsAtBoot = jest.mocked(loadCountervalues).mock.calls.length;
    reads.renders = 0;

    act(() => {
      store.dispatch(
        addExtraTrackingPairs([
          { from: getCryptoCurrencyById("ethereum"), to: usd, startDate: new Date("2026-01-01") },
        ]),
      );
    });
    await advance(AFTER_DEBOUNCE_MS);

    // The new settings reached the loop: one reload with both pairs, and no second restore.
    expect(jest.mocked(loadCountervalues).mock.calls.length).toBe(loadsAtBoot + 1);
    expect(jest.mocked(loadCountervalues).mock.lastCall?.[1].trackingPairs).toHaveLength(2);
    expect(jest.mocked(importCountervalues).mock.calls.length).toBe(restoresAtBoot);
    // The reload returns the same state: nothing changed, so nothing re-rendered.
    expect(reads).toEqual({ renders: 0, unchanged: 0 });
  });
});
