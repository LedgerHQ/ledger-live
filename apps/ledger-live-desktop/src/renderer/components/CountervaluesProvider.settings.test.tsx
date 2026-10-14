import { loadCountervalues } from "@domain/api-market-countervalues";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import {
  exportCountervalues,
  importCountervalues,
  pairId,
  type CounterValuesStateRaw,
} from "@domain/entity-market-countervalues";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { act, render } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { renderHook } from "tests/testSetup";
import { useCalculateCountervaluesUserSettings } from "~/renderer/actions/general";
import { addExtraTrackingPairs } from "~/renderer/reducers/countervaluesExtraTracking";
import dbMiddleware from "~/renderer/middlewares/db";
import type { State } from "~/renderer/reducers";
import createStore from "~/state-manager/configureStore";
import { CountervaluesBridgedProvider, useCountervaluesBridge } from "./CountervaluesProvider";

jest.mock("@domain/api-market-countervalues", () => ({
  ...jest.requireActual("@domain/api-market-countervalues"),
  loadCountervalues: jest.fn(),
}));

jest.mock("@domain/entity-market-countervalues", () => {
  const actual = jest.requireActual("@domain/entity-market-countervalues");
  return { ...actual, importCountervalues: jest.fn(actual.importCountervalues) };
});

jest.mock("@features/platform-market-countervalues", () => ({
  ...jest.requireActual("@features/platform-market-countervalues"),
  useGetCounterValueIdsPolling: () => mockSupportedCryptoIds,
}));

jest.mock("~/renderer/storage", () => ({
  ...jest.requireActual("~/renderer/storage"),
  setKey: (namespace: string, key: string, value: CounterValuesStateRaw) =>
    mockSetKey(namespace, key, value),
}));

const mockSupportedCryptoIds = ["bitcoin"];
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

// The first poll tick fires at the provider's default pollInitDelay (3s): stop just before it.
const BOOT_WINDOW_MS = 2_999;

function countervaluesSaves(): CounterValuesStateRaw[] {
  return mockSetKey.mock.calls
    .filter(([namespace, key]) => namespace === "app" && key === "countervalues")
    .map(([, , value]) => value);
}

describe("CountervaluesBridgedProvider at startup", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-08T12:00:00Z") });
    jest.mocked(loadCountervalues).mockImplementation(state => Promise.resolve(state));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("restores and loads once with the account pairs, then saves the restored rates", async () => {
    const store = createStore({
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      state: {
        accounts: [genAccount("countervalues-startup-btc", { currency: bitcoin })],
      } as State,
      dbMiddleware,
      fetchRemoteFlags: null,
    });

    render(
      <Provider store={store}>
        <CountervaluesBridgedProvider initialState={savedState}>
          <div />
        </CountervaluesBridgedProvider>
      </Provider>,
    );
    await act(async () => {
      await jest.advanceTimersByTimeAsync(BOOT_WINDOW_MS);
    });

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

describe("useCountervaluesBridge", () => {
  // The bridge is the context value: a new one would re-render every countervalues consumer.
  it("keeps the same bridge when the settings change", () => {
    const { result, store } = renderHook(
      () => ({
        bridge: useCountervaluesBridge(),
        settings: useCalculateCountervaluesUserSettings(),
      }),
      {
        initialState: { accounts: [genAccount("countervalues-bridge-btc", { currency: bitcoin })] },
      },
    );
    const { bridge, settings } = result.current;

    act(() => {
      store.dispatch(
        addExtraTrackingPairs([
          { from: getCryptoCurrencyById("ethereum"), to: usd, startDate: new Date("2026-01-01") },
        ]),
      );
    });

    expect(result.current.settings).not.toBe(settings);
    expect(result.current.bridge).toBe(bridge);
    expect(bridge.useUserSettings).toBe(useCalculateCountervaluesUserSettings);
  });
});
