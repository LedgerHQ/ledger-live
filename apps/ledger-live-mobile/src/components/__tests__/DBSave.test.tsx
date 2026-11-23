import { cryptoAssetsApi } from "@domain/api-currency-token";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { calApi } from "@shared/api-services";
import { dismissAccountAnalyticsIntroduction } from "@features/flow-account-detail-analytics-notice/state";
import { markReceiveVerifyHintSeen } from "@features/flow-receive/state";
import { act, renderHook, waitFor } from "@tests/test-renderer";
import { AppState, type AppStateStatus } from "react-native";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import storage from "LLM/storage";
import { addOneAccount } from "~/actions/accounts";
import { persistence } from "~/persistence/composition";
import { markOperationsAsSeen } from "~/reducers/history";
import { setMarketBannerRanking } from "~/reducers/marketBanner";
import type { State } from "~/reducers/types";
import { ConfigureDBSaveEffects, flushAll, useDBSaveEffect } from "../DBSave";

jest.mock("~/persistence/composition", () => ({
  persistence: { flush: jest.fn(() => Promise.resolve()) },
}));

const account = genAccount("dbsave-accounts", { currency: getCryptoCurrencyById("bitcoin") });
const accountKey = `accounts.active.${account.id}`;

describe("useDBSaveEffect with a record key", () => {
  const save = jest.fn(() => Promise.resolve());
  const saveAtStartEffect = {
    stateSelector: (state: State) => state.history,
    throttle: 500,
    getChangesStats: () => false,
    lense: (state: State) => state.history,
    save,
    saveAtStart: true,
    recordKey: "history",
  };

  beforeEach(() => save.mockClear());

  it("saves at start while persistence does not own the record", async () => {
    renderHook(() => useDBSaveEffect(saveAtStartEffect));
    await act(flushAll);

    expect(save).toHaveBeenCalledTimes(1);
  });

  it("does not save at start once persistence owns the record, even when it failed", async () => {
    renderHook(() => useDBSaveEffect(saveAtStartEffect), {
      overrideInitialState: state => ({
        ...state,
        persistence: { records: { history: "failed" } },
      }),
    });
    await act(flushAll);

    expect(save).not.toHaveBeenCalled();
  });
});

describe("ConfigureDBSaveEffects", () => {
  beforeEach(async () => {
    await storage.delete("cryptoAssetsCache");
  });

  it("saves a CAL cache that the hash check updated before the effects mounted", async () => {
    const checkedCache = cryptoAssetsApi.util.upsertQueryEntries([
      { endpointName: "findTokenById", arg: { id: usdcToken.id }, value: usdcToken },
      { endpointName: "getTokensSyncHash", arg: "ethereum", value: "new-hash" },
    ]);

    renderHook(() => ConfigureDBSaveEffects(), {
      overrideInitialState: state => ({
        ...state,
        [calApi.reducerPath]: calApi.reducer(state[calApi.reducerPath], checkedCache),
      }),
    });

    await waitFor(async () =>
      expect(await storage.get("cryptoAssetsCache")).toMatchObject({
        tokens: [{ data: usdcToken }],
        hashes: { ethereum: "new-hash" },
      }),
    );
  });

  it("keeps the stored Analytics introduction state when the effects mount after a failed read", async () => {
    const stored = { hasDismissed: true, isEligible: true };
    await storage.save("accountAnalyticsIntroduction", stored);

    renderHook(() => ConfigureDBSaveEffects());
    await act(flushAll);

    expect(await storage.get("accountAnalyticsIntroduction")).toEqual(stored);
  });

  it("persists the Analytics introduction dismissal so it survives a restart", async () => {
    await storage.delete("accountAnalyticsIntroduction");
    const { store } = renderHook(() => ConfigureDBSaveEffects());

    act(() => {
      store.dispatch(dismissAccountAnalyticsIntroduction());
    });

    await waitFor(async () =>
      expect(await storage.get("accountAnalyticsIntroduction")).toEqual({
        hasDismissed: true,
        isEligible: null,
      }),
    );
  });

  it("persists the receive verify hint as seen so it survives a restart", async () => {
    await storage.delete("receiveVerifyHint");
    const { store } = renderHook(() => ConfigureDBSaveEffects());

    act(() => {
      store.dispatch(markReceiveVerifyHintSeen());
    });

    await waitFor(async () =>
      expect(await storage.get("receiveVerifyHint")).toEqual({ hasSeenReceiveVerifyHint: true }),
    );
  });

  it("saves history when history does not use persistence", async () => {
    await storage.delete("history");
    const { store } = renderHook(() => ConfigureDBSaveEffects());

    act(() => {
      store.dispatch(markOperationsAsSeen());
    });

    await waitFor(async () =>
      expect(await storage.get("history")).toEqual({
        lastSeenOperationDate: store.getState().history.lastSeenOperationDate,
      }),
    );
  });

  it("leaves history to persistence when history uses persistence", async () => {
    await storage.delete("history");
    const { store } = renderHook(() => ConfigureDBSaveEffects(), {
      overrideInitialState: state => ({
        ...state,
        persistence: { records: { history: "loaded" } },
      }),
    });

    act(() => {
      store.dispatch(markOperationsAsSeen());
    });
    await act(flushAll);

    expect(await storage.get("history")).toBeUndefined();
  });

  it("saves the market banner when the market banner does not use persistence", async () => {
    await storage.delete("marketBanner");
    const { store } = renderHook(() => ConfigureDBSaveEffects());

    act(() => {
      store.dispatch(setMarketBannerRanking("losers"));
    });

    await waitFor(async () =>
      expect(await storage.get("marketBanner")).toEqual({ ranking: "losers" }),
    );
  });

  it("leaves the market banner to persistence when the market banner uses persistence", async () => {
    await storage.delete("marketBanner");
    const { store } = renderHook(() => ConfigureDBSaveEffects(), {
      overrideInitialState: state => ({
        ...state,
        persistence: { records: { marketBanner: "loaded" } },
      }),
    });

    act(() => {
      store.dispatch(setMarketBannerRanking("losers"));
    });
    await act(flushAll);

    expect(await storage.get("marketBanner")).toBeUndefined();
  });

  it("saves the accounts when the accounts do not use persistence", async () => {
    await storage.delete(accountKey);
    const { store } = renderHook(() => ConfigureDBSaveEffects());

    act(() => {
      store.dispatch(addOneAccount(account));
    });

    await waitFor(async () => expect(await storage.get(accountKey)).toBeDefined());
  });

  it("leaves the accounts to persistence when the accounts use persistence", async () => {
    await storage.delete(accountKey);
    const { store } = renderHook(() => ConfigureDBSaveEffects(), {
      overrideInitialState: state => ({
        ...state,
        persistence: { records: { accounts: "loaded" } },
      }),
    });

    act(() => {
      store.dispatch(addOneAccount(account));
    });
    await act(flushAll);

    expect(await storage.get(accountKey)).toBeUndefined();
  });

  it("waits in flushAll for a legacy save to end", async () => {
    await storage.delete("accountAnalyticsIntroduction");
    const save = { finish: () => {} };
    const saveHeld = new Promise<void>(resolve => (save.finish = resolve));
    const realSave = storage.save.bind(storage);
    const spy = jest.spyOn(storage, "save").mockImplementation(async (key, value) => {
      if (key === "accountAnalyticsIntroduction") await saveHeld;
      return realSave(key, value);
    });
    const { store } = renderHook(() => ConfigureDBSaveEffects());

    act(() => {
      store.dispatch(dismissAccountAnalyticsIntroduction());
    });
    let flushed = false;
    const flushing = flushAll().then(() => (flushed = true));
    await act(async () => {
      for (let tick = 0; tick < 20; tick++) await Promise.resolve();
    });
    expect(flushed).toBe(false);

    save.finish();
    await act(() => flushing);
    expect(await storage.get("accountAnalyticsIntroduction")).toEqual({
      hasDismissed: true,
      isEligible: null,
    });
    spy.mockRestore();
  });

  it("flushes persistence in flushAll", async () => {
    jest.mocked(persistence.flush).mockClear();
    renderHook(() => ConfigureDBSaveEffects());

    await act(flushAll);

    expect(persistence.flush).toHaveBeenCalledTimes(1);
  });

  it("flushes persistence when the app goes to the background", () => {
    const listeners: Array<(state: AppStateStatus) => void> = [];
    jest.spyOn(AppState, "addEventListener").mockImplementation((_type, listener) => {
      listeners.push(listener);
      return { remove: jest.fn() };
    });
    jest.mocked(persistence.flush).mockClear();
    renderHook(() => ConfigureDBSaveEffects());

    listeners.forEach(listener => listener("active"));
    expect(persistence.flush).not.toHaveBeenCalled();
    listeners.forEach(listener => listener("background"));
    expect(persistence.flush).toHaveBeenCalledTimes(1);
  });
});
