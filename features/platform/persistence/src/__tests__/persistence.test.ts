import { combineReducers, configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { defineRecord, recordVersions } from "@shared/persistence";
import { createMemoryStorage, type StoragePort } from "@shared/storage";
import { createPersistence } from "../createPersistence";
import { persistenceSlice, selectUsesPersistence, selectRecordStatus } from "../persistenceSlice";
import type { PersistenceFailure } from "../reportFailure";

type Counter = { value: number };

const makeCounterSlice = (name: string) =>
  createSlice({
    name,
    initialState: { value: 0 } as Counter,
    reducers: {
      init: (_, action: PayloadAction<Counter>) => action.payload,
      increment: state => {
        state.value += 1;
      },
    },
  });

const first = makeCounterSlice("first");
const second = makeCounterSlice("second");

const rootReducer = combineReducers({
  first: first.reducer,
  second: second.reducer,
  persistence: persistenceSlice.reducer,
});
type State = ReturnType<typeof rootReducer>;

const counterVersions = recordVersions(z => z.object({ value: z.number() }));

const firstRecord = defineRecord({
  key: "first",
  versions: counterVersions,
  codec: { encode: (counter: Counter) => counter, decode: stored => stored },
  state: { select: (state: State) => state.first, toHydrationAction: first.actions.init },
});

const secondRecord = defineRecord({
  key: "second",
  versions: counterVersions,
  codec: { encode: (counter: Counter) => counter, decode: stored => stored },
  state: { select: (state: State) => state.second, toHydrationAction: second.actions.init },
});

const records = [firstRecord, secondRecord];
const bindings = records.map(record => ({ record }));

const flushWrites = async () => {
  for (let tick = 0; tick < 10; tick++) await Promise.resolve();
};

function setup(storage: StoragePort = createMemoryStorage()) {
  const failures: PersistenceFailure[] = [];
  const report = (failure: PersistenceFailure) => failures.push(failure);
  const persistence = createPersistence<State>({ storage, bindings, report });
  const store = configureStore({
    reducer: rootReducer,
    middleware: getDefault => getDefault().concat(persistence.middleware),
  });
  const hydrate = (selected?: ReadonlyArray<{ key: string }>) =>
    persistence.hydrate(store, selected ? { keys: selected.map(record => record.key) } : undefined);
  return { store, storage, failures, hydrate, persistence };
}

describe("hydrate", () => {
  it("loads a stored value into Redux", async () => {
    const { store, hydrate } = setup(createMemoryStorage({ first: { value: 5 } }));
    await hydrate();
    expect(store.getState().first).toEqual({ value: 5 });
    expect(selectRecordStatus(store.getState(), "first")).toBe("loaded");
  });

  it("reads a stored null as a missing value", async () => {
    const { store, hydrate } = setup(createMemoryStorage({ first: null }));
    await hydrate();
    expect(selectRecordStatus(store.getState(), "first")).toBe("empty");
  });

  it("keeps the Redux default for a missing value", async () => {
    const { store, hydrate } = setup();
    await hydrate();
    expect(store.getState().first).toEqual({ value: 0 });
    expect(selectRecordStatus(store.getState(), "first")).toBe("empty");
  });

  it("marks an invalid value as failed and reports it without the value", async () => {
    const { store, failures, hydrate } = setup(createMemoryStorage({ first: { value: "secret" } }));
    await hydrate();
    expect(store.getState().first).toEqual({ value: 0 });
    expect(selectRecordStatus(store.getState(), "first")).toBe("failed");
    expect(failures).toEqual([
      expect.objectContaining({ key: "first", version: 0, operation: "decode" }),
    ]);
    expect(JSON.stringify(failures)).not.toContain("secret");
  });

  it("marks a value it cannot read as failed", async () => {
    const storage = createMemoryStorage();
    storage.get = jest.fn().mockRejectedValue(new SyntaxError("Unexpected token s in secret"));
    const { store, failures, hydrate } = setup(storage);
    await hydrate([firstRecord]);
    expect(selectRecordStatus(store.getState(), "first")).toBe("failed");
    expect(failures).toEqual([
      { key: "first", version: 0, operation: "read", reason: "SyntaxError" },
    ]);
  });

  it("loads the other records when 1 record fails", async () => {
    const { store, hydrate } = setup(
      createMemoryStorage({ first: { value: "bad" }, second: { value: 7 } }),
    );
    await hydrate();
    expect(selectRecordStatus(store.getState(), "first")).toBe("failed");
    expect(store.getState().second).toEqual({ value: 7 });
    expect(selectRecordStatus(store.getState(), "second")).toBe("loaded");
  });

  it("makes only the selected records use persistence", async () => {
    const { store, hydrate } = setup();
    await hydrate([firstRecord]);
    expect(selectUsesPersistence(store.getState(), "first")).toBe(true);
    expect(selectUsesPersistence(store.getState(), "second")).toBe(false);
  });
});

describe("writes", () => {
  it("writes a loaded record when its slice changes", async () => {
    const { store, storage, hydrate } = setup(createMemoryStorage({ first: { value: 1 } }));
    await hydrate();
    store.dispatch(first.actions.increment());
    await flushWrites();
    await expect(storage.get("first")).resolves.toEqual({ value: 2 });
  });

  it("writes an empty record when its slice changes", async () => {
    const { store, storage, hydrate } = setup();
    await hydrate();
    store.dispatch(first.actions.increment());
    await flushWrites();
    await expect(storage.get("first")).resolves.toEqual({ value: 1 });
  });

  it("does not write the value it just hydrated", async () => {
    const storage = createMemoryStorage({ first: { value: 1 } });
    const set = jest.spyOn(storage, "set");
    const { hydrate } = setup(storage);
    await hydrate();
    await flushWrites();
    expect(set).not.toHaveBeenCalled();
  });

  it("writes only the record whose slice changed", async () => {
    const storage = createMemoryStorage();
    const set = jest.spyOn(storage, "set");
    const { store, hydrate } = setup(storage);
    await hydrate();
    store.dispatch(second.actions.increment());
    await flushWrites();
    expect(set).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith("second", { value: 1 });
  });

  it("never writes a failed record", async () => {
    const storage = createMemoryStorage({ first: { value: "bad" } });
    const { store, hydrate } = setup(storage);
    await hydrate();
    store.dispatch(first.actions.increment());
    await flushWrites();
    await expect(storage.get("first")).resolves.toEqual({ value: "bad" });
  });

  it("does not write a record before hydration", async () => {
    const storage = createMemoryStorage();
    const set = jest.spyOn(storage, "set");
    const { store } = setup(storage);
    store.dispatch(first.actions.increment());
    store.dispatch(first.actions.increment());
    await flushWrites();
    expect(set).not.toHaveBeenCalled();
  });

  it("does not write a record that does not use persistence", async () => {
    const storage = createMemoryStorage();
    const set = jest.spyOn(storage, "set");
    const { store, hydrate } = setup(storage);
    await hydrate([firstRecord]);
    store.dispatch(second.actions.increment());
    await flushWrites();
    expect(set).not.toHaveBeenCalled();
  });

  it("keeps the order of the writes", async () => {
    const { store, storage, hydrate } = setup();
    await hydrate();
    store.dispatch(first.actions.increment());
    store.dispatch(first.actions.increment());
    store.dispatch(first.actions.increment());
    await flushWrites();
    await expect(storage.get("first")).resolves.toEqual({ value: 3 });
  });

  it("reports a write error without the value", async () => {
    const storage = createMemoryStorage();
    storage.set = jest.fn().mockRejectedValue(new Error("disk full"));
    const { store, failures, hydrate } = setup(storage);
    await hydrate([firstRecord]);
    store.dispatch(first.actions.increment());
    await flushWrites();
    expect(failures).toEqual([{ key: "first", version: 0, operation: "write", reason: "Error" }]);
  });

  it("flush waits for every write, also after 1 fails, then rejects", async () => {
    const storage = createMemoryStorage();
    const slowWrite = { finish: () => {} };
    let slowWriteDone = false;
    storage.set = jest.fn(async (key: string) => {
      if (key === "first") throw new Error("disk full");
      await new Promise<void>(resolve => (slowWrite.finish = resolve));
      slowWriteDone = true;
    });
    const { store, hydrate, persistence } = setup(storage);
    await hydrate();
    store.dispatch(first.actions.increment());
    store.dispatch(second.actions.increment());

    const flushing = persistence
      .flush()
      .catch((error: unknown) => ({ rejected: error, slowWriteDone }));
    await flushWrites();
    slowWrite.finish();

    await expect(flushing).resolves.toEqual({ rejected: expect.any(Error), slowWriteDone: true });
  });
});
