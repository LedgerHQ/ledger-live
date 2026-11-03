import { configureStore, type Middleware } from "@reduxjs/toolkit";
import { createAccountDataRecorder, type AccountDataRecorder } from "@devtools/bindings";
import {
  accountDataExtra,
  fetchAccountData,
  type AccountDataSource,
} from "@domain/api-account-data";
import { descriptor, sourceIdOf } from "@domain/api-account-data/testing";
import { renderHook } from "tests/testSetup";
import reducers from "~/renderer/reducers";
import { accountDataSources, accountDataTaps } from "~/config/account-data-setup";
import { accountDataRecorder, useAccountDataRecorder } from "./accountDataRecorder";

const mockReadCounter = jest.fn<Promise<number>, []>();
const mockFullSyncSource: AccountDataSource = {
  id: sourceIdOf("full-sync"),
  supports: () => true,
  read: { counter: () => mockReadCounter() },
};
jest.mock("@ledgerhq/live-common/account-data/full-sync/createFullSyncSource", () => ({
  createFullSyncSource: () => mockFullSyncSource,
}));

function storeWith(sources: readonly AccountDataSource[], middleware: Middleware) {
  return configureStore({
    reducer: reducers,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
        thunk: { extraArgument: accountDataExtra(sources) },
      }).concat(middleware),
  });
}

/** The app's store, built with the taps as at boot. */
function appStore() {
  const sources = accountDataSources(
    () => store.getState(),
    action => store.dispatch(action),
  );
  const store = storeWith(sources, accountDataTaps.middleware);
  return store;
}

/** A store with a recorder plugged in at creation, as the app did before the taps. */
function recordedStore(recorder: AccountDataRecorder) {
  return storeWith(recorder.instrument([mockFullSyncSource]), recorder.middleware);
}

/** A head read that succeeds, then one that fails, both past any freshness. */
async function readTwice(store: ReturnType<typeof storeWith>) {
  mockReadCounter.mockResolvedValueOnce(5);
  await store.dispatch(fetchAccountData("counter", descriptor, { maxAge: 0 }));
  mockReadCounter.mockRejectedValueOnce(new Error("down"));
  await store.dispatch(fetchAccountData("counter", descriptor, { maxAge: 0 }));
}

const VOLATILE_FIELDS = new Set(["id", "at", "requestId", "elapsedMs"]);

const stableEvents = (recorder: AccountDataRecorder) =>
  recorder
    .getEvents()
    .map(event =>
      Object.fromEntries(Object.entries(event).filter(([key]) => !VOLATILE_FIELDS.has(key))),
    );

const timedEvents = (recorder: AccountDataRecorder) =>
  recorder.getEvents().map(event => "elapsedMs" in event && event.elapsedMs !== undefined);

describe("useAccountDataRecorder", () => {
  it("records from the first DevTools opening the same events as a recorder plugged in at boot", async () => {
    const store = appStore();
    await readTwice(store);
    expect(accountDataRecorder.getEvents()).toEqual([]);

    const { result } = renderHook(() => useAccountDataRecorder());
    expect(result.current).toBe(accountDataRecorder);
    await readTwice(store);

    const reference = createAccountDataRecorder();
    await readTwice(recordedStore(reference));

    expect(accountDataRecorder.getEvents().map(({ type }) => type)).toEqual([
      "requested",
      "source-call",
      "received",
      "requested",
      "source-call",
      "failed",
    ]);
    expect(stableEvents(accountDataRecorder)).toEqual(stableEvents(reference));
    expect(timedEvents(accountDataRecorder)).toEqual(timedEvents(reference));
  });
});
