import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  createPersistence,
  persistenceSlice,
  selectRecordStatus,
} from "@features/platform-persistence";
import { createMemoryStorage } from "@shared/storage";
import history, { initHistory, markOperationsAsSeen } from "~/renderer/reducers/history";
import { historyRecord } from "../history";
import storedDate from "./__fixtures__/history.date.json";
import storedNull from "./__fixtures__/history.null.json";

const rootReducer = combineReducers({ history, persistence: persistenceSlice.reducer });
type TestState = ReturnType<typeof rootReducer>;
const bindings = [{ record: historyRecord }];

const flushWrites = async () => {
  for (let tick = 0; tick < 10; tick++) await Promise.resolve();
};

function setup(stored: Record<string, unknown>) {
  const storage = createMemoryStorage(stored);
  const report = jest.fn();
  const persistence = createPersistence<TestState>({ storage, bindings, report });
  const store = configureStore({
    reducer: rootReducer,
    middleware: getDefault => getDefault().concat(persistence.middleware),
  });
  const hydrate = () => persistence.hydrate(store);
  return { storage, store, report, hydrate };
}

describe.each([
  ["a date", storedDate],
  ["null", storedNull],
])("history stored with %s", (_label, stored) => {
  it("hydrates to the same state as the legacy initHistory", async () => {
    const { store, hydrate, report } = setup({ history: stored });
    await hydrate();

    expect(store.getState().history).toEqual(history(undefined, initHistory(stored)));
    expect(selectRecordStatus(store.getState(), "history")).toBe("loaded");
    expect(report).not.toHaveBeenCalled();
  });

  it("encodes the state to the legacy stored JSON", () => {
    const state = { history: history(undefined, initHistory(stored)) };
    expect(JSON.stringify(historyRecord.codec.encode(historyRecord.state.select(state)))).toBe(
      JSON.stringify(stored),
    );
  });
});

describe("history write", () => {
  it("writes the legacy shape when the operations are marked as seen", async () => {
    const { store, storage, hydrate } = setup({ history: storedNull });
    await hydrate();

    store.dispatch(markOperationsAsSeen());
    await flushWrites();

    await expect(storage.get("history")).resolves.toEqual({
      lastSeenOperationDate: store.getState().history.lastSeenOperationDate,
    });
    expect(store.getState().history.lastSeenOperationDate).toEqual(expect.any(String));
  });
});

describe("history stored with a key that this app does not know", () => {
  it("fails the record and never writes over the unknown value", async () => {
    const unknown = { lastSeenOperationDate: null, pinned: true };
    const { store, storage, hydrate, report } = setup({ history: unknown });
    await hydrate();

    store.dispatch(markOperationsAsSeen());
    await flushWrites();

    expect(selectRecordStatus(store.getState(), "history")).toBe("failed");
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({ key: "history", operation: "decode" }),
    );
    await expect(storage.get("history")).resolves.toEqual(unknown);
  });
});

describe("history stored by a newer version", () => {
  it("fails the record with a newer report and never writes over the newer value", async () => {
    const newer = { $v: 1, data: { lastSeenOperationDate: null } };
    const { store, storage, hydrate, report } = setup({ history: newer });
    await hydrate();

    store.dispatch(markOperationsAsSeen());
    await flushWrites();

    expect(selectRecordStatus(store.getState(), "history")).toBe("failed");
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({ key: "history", operation: "newer" }),
    );
    await expect(storage.get("history")).resolves.toEqual(newer);
  });
});
