import React from "react";
import { act, render } from "@testing-library/react-native";
import { Provider } from "react-redux";
import { loadCountervalues } from "@domain/api-market-countervalues";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import {
  exportCountervalues,
  importCountervalues,
  pairId,
} from "@domain/entity-market-countervalues";
import {
  createCountervaluesMiddleware,
  startCountervaluesSync,
  useCountervaluesState,
  wipeCountervalues,
} from "@features/platform-market-countervalues";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { createStore } from "@tests/test-renderer";
import { reboot } from "~/actions/appstate";
import { setCountervalue } from "~/actions/settings";

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

jest.mock("@features/platform-market-countervalues", () => {
  const actual = jest.requireActual("@features/platform-market-countervalues");
  return {
    ...actual,
    createCountervaluesMiddleware: jest.fn(actual.createCountervaluesMiddleware),
  };
});

const mockSupportedCryptoIds = ["bitcoin"];

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

// Longer than the 1 s settings debounce plus the 3 s delay before the first poll tick.
const WINDOW_MS = 10_000;

async function settle() {
  await act(async () => {
    jest.advanceTimersByTime(WINDOW_MS);
  });
}

function createTestStore() {
  return createStore({
    overrideInitialState: state => ({
      ...state,
      accounts: {
        ...state.accounts,
        active: [genAccount("countervalues-mobile-btc", { currency: bitcoin })],
      },
    }),
  });
}

describe("the mobile countervalues middleware", () => {
  beforeEach(() => {
    jest.mocked(loadCountervalues).mockImplementation(state => Promise.resolve(state));
  });

  // Two installs would run two polling loops and fetch every pair twice, with no error.
  it("is installed exactly once per store", () => {
    jest.mocked(createCountervaluesMiddleware).mockClear();

    createTestStore();

    expect(createCountervaluesMiddleware).toHaveBeenCalledTimes(1);
  });

  // Without a context, a component reading the state re-renders only when the state changes.
  it("does not re-render a component that only reads the countervalues state on a settings change", async () => {
    const store = createTestStore();
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
    await settle();
    const restoresAtBoot = jest.mocked(importCountervalues).mock.calls.length;
    const loadsAtBoot = jest.mocked(loadCountervalues).mock.calls.length;
    reads.renders = 0;

    await act(async () => {
      store.dispatch(setCountervalue("EUR"));
    });
    await settle();

    // The new settings reached the loop: one reload in the new currency, and no second restore.
    expect(jest.mocked(importCountervalues).mock.calls.length).toBe(restoresAtBoot);
    expect(jest.mocked(loadCountervalues).mock.calls.length).toBe(loadsAtBoot + 1);
    expect(jest.mocked(loadCountervalues).mock.lastCall?.[1].trackingPairs[0].to.ticker).toBe(
      "EUR",
    );
    // The reload returns the same state: nothing changed, so nothing re-rendered.
    expect(reads).toEqual({ renders: 0, unchanged: 0 });
  });

  it("starts again from the saved state after a reboot's wipe", async () => {
    const store = createTestStore();
    store.dispatch(startCountervaluesSync({ savedState }));
    await settle();
    const restoresAtBoot = jest.mocked(importCountervalues).mock.calls.length;

    // What rebootMiddleware does: the wipe goes in the same tick as the reboot.
    await act(async () => {
      store.dispatch(reboot());
      store.dispatch(wipeCountervalues());
    });
    await settle();

    expect(jest.mocked(importCountervalues).mock.calls.length).toBe(restoresAtBoot + 1);
    expect(Object.keys(store.getState().countervalues.countervalues.state.data)).toEqual([BTC_USD]);
  });
});
