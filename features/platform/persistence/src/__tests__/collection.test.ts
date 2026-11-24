import { combineReducers, configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { defineCollectionRecord, recordVersions } from "@shared/persistence";
import { createMemoryStorage, StorageLockedError, type ListableStoragePort } from "@shared/storage";
import { keyPerEntry, type PersistenceBinding, type WriteStrategy } from "../bindings";
import { createPersistence } from "../createPersistence";
import { persistenceSlice, selectRecordStatus } from "../persistenceSlice";
import type { PersistenceFailure } from "../reportFailure";

type Item = { id: string; value: number; seen?: number };

const items = createSlice({
  name: "items",
  initialState: [] as Item[],
  reducers: {
    init: (_, action: PayloadAction<Item[]>) => action.payload,
    add: (state, action: PayloadAction<Item>) => [...state, action.payload],
    remove: (state, action: PayloadAction<string>) =>
      state.filter(item => item.id !== action.payload),
    setValue: (state, action: PayloadAction<{ id: string; value: number }>) =>
      state.map(item =>
        item.id === action.payload.id ? { ...item, value: action.payload.value } : item,
      ),
    touch: (state, action: PayloadAction<string>) =>
      state.map(item =>
        item.id === action.payload ? { ...item, seen: (item.seen ?? 0) + 1 } : item,
      ),
    reverseOrder: state => state.map((_, index) => state[state.length - 1 - index]),
  },
});

const rootReducer = combineReducers({
  items: items.reducer,
  persistence: persistenceSlice.reducer,
});
type State = ReturnType<typeof rootReducer>;

const payloadIdOf = (payload: unknown) => (payload as { data?: { id?: unknown } })?.data?.id;

const itemsRecord = defineCollectionRecord({
  key: "items",
  versions: recordVersions(z =>
    z.strictObject({
      data: z.looseObject({ id: z.string(), value: z.number() }),
      version: z.number().int().min(0).max(3),
    }),
  ),
  entryId: (item: Item) => item.id,
  storedEntryId: payload => {
    const id = payloadIdOf(payload);
    return typeof id === "string" ? id : undefined;
  },
  codec: {
    // As the desktop id migration of 2018, a version 0 entry gets a new id.
    decode: async ({ data, version }) => ({
      id: version === 0 ? `migrated-${data.id}` : data.id,
      value: data.value,
    }),
    decodedId: (item: Item) => item.id,
    encode: async (item: Item) => ({ data: { id: item.id, value: item.value }, version: 3 }),
  },
  state: {
    select: (state: State) => state.items,
    changed: (previous: Item, next: Item) => previous.value !== next.value,
    // As an app can drop an entry, this record drops a negative value.
    toHydrationActions: decoded => [items.actions.init(decoded.filter(item => item.value >= 0))],
  },
});

const entry = (id: string, value: number, version = 3) => ({ data: { id, value }, version });

const idOf = (stored: unknown) => itemsRecord.storedEntryId(stored);

const PREFIX = "items.active.";
const ORDER_KEY = "items.sort";

type KeyScheme = "singleKey" | "keyPerEntry";

function storeEntries(keyScheme: KeyScheme, entries: unknown[], order?: unknown) {
  if (keyScheme === "singleKey") return { items: entries };
  const stored: Record<string, unknown> = Object.fromEntries(
    entries.map((value, index) => [PREFIX + String(idOf(value) ?? `broken-${index}`), value]),
  );
  if (order !== undefined) stored[ORDER_KEY] = order;
  return stored;
}

/** The stored entries, by id, whatever their order. */
async function readStored(keyScheme: KeyScheme, storage: ListableStoragePort) {
  if (keyScheme === "singleKey") return storage.get("items");
  const keys = [...(await storage.keys(PREFIX))].sort();
  return Promise.all(keys.map(key => storage.get(key)));
}

async function readStoredIds(keyScheme: KeyScheme, storage: ListableStoragePort) {
  const stored = await readStored(keyScheme, storage);
  return (Array.isArray(stored) ? stored : [])
    .map(value => String(idOf(value)))
    .sort((a, b) => a.localeCompare(b));
}

const settle = async () => {
  for (let tick = 0; tick < 20; tick++) await Promise.resolve();
};

function setup({
  keyScheme = "singleKey",
  stored = {},
  strategy = "immediate",
  storage = createMemoryStorage(stored),
}: {
  keyScheme?: KeyScheme;
  stored?: Record<string, unknown>;
  strategy?: WriteStrategy;
  storage?: ListableStoragePort;
} = {}) {
  const failures: PersistenceFailure[] = [];
  const report = (failure: PersistenceFailure) => failures.push(failure);
  const binding: PersistenceBinding<State> = {
    record: itemsRecord,
    keyScheme:
      keyScheme === "keyPerEntry"
        ? keyPerEntry({ prefix: PREFIX, orderKey: ORDER_KEY })
        : undefined,
    strategy,
  };
  const persistence = createPersistence<State>({ storage, bindings: [binding], report });
  const store = configureStore({
    reducer: rootReducer,
    middleware: getDefault => getDefault().concat(persistence.middleware),
  });
  const set = jest.spyOn(storage, "set");
  const remove = jest.spyOn(storage, "remove");
  const hydrate = (options?: { keys?: string[] }) => persistence.hydrate(store, options);
  return { store, storage, failures, hydrate, persistence, set, remove };
}

const UNREADABLE_ENTRIES: Array<[string, unknown]> = [
  ["a wrong shape", { data: { id: "b", value: "secret" }, version: 3 }],
  ["a newer version", entry("b", 2, 4)],
  ["an unknown envelope key", { ...entry("b", 2), checksum: "secret" }],
];

describe.each(["singleKey", "keyPerEntry"] as const)(
  "a collection with the %s key scheme",
  keyScheme => {
    it("loads the stored entries in order", async () => {
      const { store, hydrate } = setup({
        keyScheme,
        stored: storeEntries(keyScheme, [entry("a", 1), entry("b", 2)], ["a", "b"]),
      });

      await expect(hydrate()).resolves.toEqual({ items: "loaded" });

      expect(store.getState().items).toEqual([
        { id: "a", value: 1 },
        { id: "b", value: 2 },
      ]);
    });

    it("is empty when nothing is stored", async () => {
      const { store, hydrate } = setup({ keyScheme });
      await expect(hydrate()).resolves.toEqual({ items: "empty" });
      expect(store.getState().items).toEqual([]);
    });

    it.each(UNREADABLE_ENTRIES)(
      "keeps an entry with %s stored, reports its index with no value, and loads the others",
      async (_label, unreadable) => {
        const { store, storage, failures, hydrate } = setup({
          keyScheme,
          stored: storeEntries(
            keyScheme,
            [entry("a", 1), unreadable, entry("c", 3)],
            ["a", "b", "c"],
          ),
        });

        await expect(hydrate()).resolves.toEqual({ items: "loaded" });
        store.dispatch(items.actions.setValue({ id: "a", value: 5 }));
        await settle();

        expect(store.getState().items.map(item => item.id)).toEqual(["a", "c"]);
        expect(failures).toEqual([
          expect.objectContaining({ key: "items", operation: "decode", entry: 1 }),
        ]);
        expect(JSON.stringify(failures)).not.toContain("secret");
        await expect(readStored(keyScheme, storage)).resolves.toEqual(
          keyScheme === "singleKey"
            ? [entry("a", 5), entry("c", 3), unreadable]
            : [entry("a", 5), unreadable, entry("c", 3)],
        );
      },
    );

    it("keeps an entry that decodes but that the app drops", async () => {
      const { store, storage, hydrate } = setup({
        keyScheme,
        stored: storeEntries(keyScheme, [entry("a", 1), entry("b", -1)], ["a", "b"]),
      });

      await hydrate();
      store.dispatch(items.actions.setValue({ id: "a", value: 5 }));
      await settle();

      expect(store.getState().items.map(item => item.id)).toEqual(["a"]);
      await expect(readStored(keyScheme, storage)).resolves.toEqual([
        entry("a", 5),
        entry("b", -1),
      ]);
    });

    it("replaces a kept entry with the state entry of the same id, then removes it with it", async () => {
      const { store, storage, hydrate } = setup({
        keyScheme,
        stored: storeEntries(keyScheme, [entry("a", 1), entry("b", 2, 4)], ["a", "b"]),
      });
      await hydrate();

      store.dispatch(items.actions.add({ id: "b", value: 20 }));
      await settle();
      await expect(readStored(keyScheme, storage)).resolves.toEqual([
        entry("a", 1),
        entry("b", 20),
      ]);

      store.dispatch(items.actions.remove("b"));
      await settle();
      await expect(readStored(keyScheme, storage)).resolves.toEqual([entry("a", 1)]);
    });

    it("replaces an entry that a migration gives a new id, then removes it for good", async () => {
      const storage = createMemoryStorage(
        storeEntries(keyScheme, [entry("a", 1, 0), entry("b", 2)], ["a", "b"]),
      );
      const first = setup({ keyScheme, storage });
      await first.hydrate();
      expect(first.store.getState().items.map(item => item.id)).toEqual(["migrated-a", "b"]);

      first.store.dispatch(items.actions.setValue({ id: "b", value: 20 }));
      await settle();
      await expect(readStoredIds(keyScheme, storage)).resolves.toEqual(["b", "migrated-a"]);

      first.store.dispatch(items.actions.remove("migrated-a"));
      await settle();
      await expect(readStoredIds(keyScheme, storage)).resolves.toEqual(["b"]);

      const next = setup({ keyScheme, storage });
      await next.hydrate();
      expect(next.store.getState().items).toEqual([{ id: "b", value: 20 }]);
    });

    it("removes the old entry when the migrated entry is the first change", async () => {
      const storage = createMemoryStorage(
        storeEntries(keyScheme, [entry("a", 1, 0), entry("b", 2)], ["a", "b"]),
      );
      const first = setup({ keyScheme, storage });
      await first.hydrate();

      first.store.dispatch(items.actions.remove("migrated-a"));
      await settle();
      await expect(readStoredIds(keyScheme, storage)).resolves.toEqual(["b"]);

      const next = setup({ keyScheme, storage });
      await next.hydrate();
      expect(next.store.getState().items).toEqual([{ id: "b", value: 2 }]);
    });

    it("does not write the entries it just hydrated", async () => {
      const { hydrate, set } = setup({
        keyScheme,
        stored: storeEntries(keyScheme, [entry("a", 1)], ["a"]),
      });
      await hydrate();
      await settle();
      expect(set).not.toHaveBeenCalled();
    });

    it("does not write when no persisted field changes", async () => {
      const { store, hydrate, set } = setup({
        keyScheme,
        stored: storeEntries(keyScheme, [entry("a", 1)], ["a"]),
      });
      await hydrate();
      store.dispatch(items.actions.touch("a"));
      await settle();
      expect(set).not.toHaveBeenCalled();
    });

    it("writes an added entry, a removed entry and a new order", async () => {
      const { store, storage, hydrate } = setup({
        keyScheme,
        stored: storeEntries(keyScheme, [entry("a", 1), entry("b", 2)], ["a", "b"]),
      });
      await hydrate();

      store.dispatch(items.actions.add({ id: "c", value: 3 }));
      store.dispatch(items.actions.remove("a"));
      store.dispatch(items.actions.reverseOrder());
      await settle();

      await expect(readStored(keyScheme, storage)).resolves.toEqual(
        keyScheme === "singleKey" ? [entry("c", 3), entry("b", 2)] : [entry("b", 2), entry("c", 3)],
      );
      if (keyScheme === "keyPerEntry")
        await expect(storage.get(ORDER_KEY)).resolves.toEqual(["c", "b"]);
    });
  },
);

describe("the singleKey key scheme", () => {
  it("reads a stored null as empty", async () => {
    const { hydrate } = setup({ stored: { items: null } });
    await expect(hydrate()).resolves.toEqual({ items: "empty" });
  });

  it("fails the record when the stored value is not a list, and never writes it", async () => {
    const { store, storage, failures, hydrate, set } = setup({ stored: { items: "not a list" } });

    await expect(hydrate()).resolves.toEqual({ items: "failed" });
    store.dispatch(items.actions.add({ id: "a", value: 1 }));
    await settle();

    expect(failures).toEqual([
      { key: "items", version: 0, operation: "decode", reason: "NotAListError" },
    ]);
    expect(set).not.toHaveBeenCalled();
    await expect(storage.get("items")).resolves.toBe("not a list");
  });
});

describe("the keyPerEntry key scheme", () => {
  it("loads the keys missing from the order first", async () => {
    const { store, hydrate } = setup({
      keyScheme: "keyPerEntry",
      stored: storeEntries(
        "keyPerEntry",
        [entry("a", 1), entry("b", 2), entry("orphan", 0)],
        ["b", "a"],
      ),
    });
    await hydrate();
    expect(store.getState().items.map(item => item.id)).toEqual(["orphan", "b", "a"]);
  });

  it("falls back to the key order when the order key is unreadable", async () => {
    const storage = createMemoryStorage(
      storeEntries("keyPerEntry", [entry("a", 1), entry("b", 2)], "not a list"),
    );
    const { store, failures, hydrate } = setup({ keyScheme: "keyPerEntry", storage });
    await hydrate();
    expect(store.getState().items.map(item => item.id)).toEqual(["a", "b"]);
    expect(failures).toEqual([]);
  });

  it("keeps an entry it cannot read: reported, not loaded, never removed", async () => {
    const storage = createMemoryStorage(
      storeEntries("keyPerEntry", [entry("a", 1), entry("b", 2)], ["a", "b"]),
    );
    const get = storage.get.bind(storage);
    storage.get = jest.fn(async (key: string) => {
      if (key === `${PREFIX}b`) throw new SyntaxError("Unexpected token in secret");
      return get(key);
    });
    const { store, failures, hydrate } = setup({ keyScheme: "keyPerEntry", storage });

    await hydrate();
    store.dispatch(items.actions.setValue({ id: "a", value: 5 }));
    await settle();

    expect(store.getState().items.map(item => item.id)).toEqual(["a"]);
    expect(failures).toEqual([
      { key: "items", version: 0, operation: "read", reason: "SyntaxError", entry: 1 },
    ]);
    await expect(storage.keys(PREFIX)).resolves.toEqual([`${PREFIX}a`, `${PREFIX}b`]);
  });

  it("fails the record when it cannot list the keys", async () => {
    const storage = createMemoryStorage(storeEntries("keyPerEntry", [entry("a", 1)], ["a"]));
    storage.keys = jest.fn().mockRejectedValue(new Error("storage closed"));
    const { hydrate } = setup({ keyScheme: "keyPerEntry", storage });
    await expect(hydrate()).resolves.toEqual({ items: "failed" });
  });

  it("writes only the changed entries, then removes the stale keys, then writes the order", async () => {
    const { store, storage, hydrate, set, remove } = setup({
      keyScheme: "keyPerEntry",
      stored: storeEntries(
        "keyPerEntry",
        [entry("a", 1), entry("b", 2), entry("c", 3)],
        ["a", "b", "c"],
      ),
    });
    await hydrate();
    const calls: string[] = [];
    set.mockImplementation(async key => {
      calls.push(`set ${key}`);
    });
    remove.mockImplementation(async key => {
      calls.push(`remove ${key}`);
    });
    jest.spyOn(storage, "keys").mockResolvedValue([`${PREFIX}a`, `${PREFIX}b`, `${PREFIX}c`]);

    store.dispatch(items.actions.setValue({ id: "b", value: 20 }));
    store.dispatch(items.actions.remove("c"));
    await settle();

    expect(calls).toEqual([`set ${PREFIX}b`, `remove ${PREFIX}c`, `set ${ORDER_KEY}`]);
  });

  it("never reads or writes the logical key", async () => {
    const { store, storage, hydrate } = setup({
      keyScheme: "keyPerEntry",
      stored: { items: "legacy value", ...storeEntries("keyPerEntry", [entry("a", 1)], ["a"]) },
    });
    const get = jest.spyOn(storage, "get");
    await hydrate();
    store.dispatch(items.actions.setValue({ id: "a", value: 2 }));
    await settle();
    expect(get).not.toHaveBeenCalledWith("items");
    await expect(storage.get("items")).resolves.toBe("legacy value");
  });

  it("refuses a storage that cannot list its keys", () => {
    const { keys: _keys, remove: _remove, ...notListable } = createMemoryStorage();
    expect(() =>
      createPersistence<State>({
        storage: notListable,
        bindings: [
          { record: itemsRecord, keyScheme: keyPerEntry({ prefix: PREFIX, orderKey: ORDER_KEY }) },
        ],
        report: jest.fn(),
      }),
    ).toThrow(TypeError);
  });
});

function createLockableStorage() {
  const storage = createMemoryStorage({ items: [entry("a", 1)] });
  const get = storage.get.bind(storage);
  let locked = true;
  storage.get = jest.fn(async (key: string) => {
    if (locked && key === "items") throw new StorageLockedError(key);
    return get(key);
  });
  return { storage, unlock: () => (locked = false) };
}

describe("a locked record", () => {
  it("is locked, not reported, and never written", async () => {
    const { storage } = createLockableStorage();
    const { store, failures, hydrate, set } = setup({ storage });

    await expect(hydrate()).resolves.toEqual({ items: "locked" });
    store.dispatch(items.actions.add({ id: "b", value: 2 }));
    await settle();

    expect(failures).toEqual([]);
    expect(set).not.toHaveBeenCalled();
  });

  it("loads after the unlock and writes from there", async () => {
    const { storage, unlock } = createLockableStorage();
    const { store, hydrate } = setup({ storage });
    await hydrate();

    unlock();
    await expect(hydrate({ keys: ["items"] })).resolves.toEqual({ items: "loaded" });
    store.dispatch(items.actions.add({ id: "b", value: 2 }));
    await settle();

    await expect(storage.get("items")).resolves.toEqual([entry("a", 1), entry("b", 2)]);
  });
});

describe("hydrate with a subset of keys", () => {
  it("hydrates only the given keys", async () => {
    const { store, hydrate } = setup({ stored: { items: [entry("a", 1)] } });
    await expect(hydrate({ keys: ["other"] })).resolves.toEqual({});
    expect(selectRecordStatus(store.getState(), "items")).toBeUndefined();
  });
});

describe("write strategies", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("debounces: 1 write with the latest state after the last change", async () => {
    const { store, storage, hydrate, set } = setup({ strategy: { debounceMs: 1000 } });
    await hydrate();

    store.dispatch(items.actions.add({ id: "a", value: 1 }));
    await jest.advanceTimersByTimeAsync(600);
    store.dispatch(items.actions.add({ id: "b", value: 2 }));
    await jest.advanceTimersByTimeAsync(600);
    expect(set).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(400);
    expect(set).toHaveBeenCalledTimes(1);
    await expect(storage.get("items")).resolves.toEqual([entry("a", 1), entry("b", 2)]);
  });

  it("throttles: a leading write, then 1 trailing write with the latest state", async () => {
    const { store, storage, hydrate, set } = setup({ strategy: { throttleMs: 500 } });
    await hydrate();

    store.dispatch(items.actions.add({ id: "a", value: 1 }));
    await jest.advanceTimersByTimeAsync(0);
    expect(set).toHaveBeenCalledTimes(1);

    store.dispatch(items.actions.add({ id: "b", value: 2 }));
    store.dispatch(items.actions.add({ id: "c", value: 3 }));
    await jest.advanceTimersByTimeAsync(499);
    expect(set).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);
    expect(set).toHaveBeenCalledTimes(2);
    await expect(storage.get("items")).resolves.toHaveLength(3);
  });

  it("flush runs the scheduled write now", async () => {
    const { store, storage, hydrate, persistence } = setup({ strategy: { debounceMs: 1000 } });
    await hydrate();

    store.dispatch(items.actions.add({ id: "a", value: 1 }));
    await persistence.flush();

    await expect(storage.get("items")).resolves.toEqual([entry("a", 1)]);
  });

  it("flush also waits for a write scheduled while an earlier write is in progress", async () => {
    const { store, storage, hydrate, persistence, set } = setup({
      strategy: { debounceMs: 1000 },
    });
    await hydrate();
    const write = { finish: () => {} };
    set.mockImplementationOnce(() => new Promise<void>(resolve => (write.finish = resolve)));

    store.dispatch(items.actions.add({ id: "a", value: 1 }));
    const flushing = persistence.flush();
    await jest.advanceTimersByTimeAsync(0);
    store.dispatch(items.actions.add({ id: "b", value: 2 }));
    write.finish();
    await flushing;

    expect(set).toHaveBeenCalledTimes(2);
    await expect(storage.get("items")).resolves.toEqual([entry("a", 1), entry("b", 2)]);
  });

  it("flush rejects when the write fails; a scheduled write only reports", async () => {
    const { store, failures, hydrate, persistence, set } = setup({
      strategy: { debounceMs: 1000 },
    });
    await hydrate();
    set.mockRejectedValue(new Error("disk full"));

    store.dispatch(items.actions.add({ id: "a", value: 1 }));
    await expect(persistence.flush()).rejects.toThrow("disk full");

    store.dispatch(items.actions.add({ id: "b", value: 2 }));
    await jest.advanceTimersByTimeAsync(1000);
    expect(failures).toEqual([
      expect.objectContaining({ operation: "write" }),
      expect.objectContaining({ operation: "write" }),
    ]);
    await expect(persistence.flush()).resolves.toBeUndefined();
  });

  it("stop cancels the scheduled write and blocks the next ones", async () => {
    const { store, hydrate, persistence, set } = setup({ strategy: { debounceMs: 1000 } });
    await hydrate();

    store.dispatch(items.actions.add({ id: "a", value: 1 }));
    await persistence.stop();
    store.dispatch(items.actions.add({ id: "b", value: 2 }));
    await jest.advanceTimersByTimeAsync(5000);
    await persistence.flush();

    expect(set).not.toHaveBeenCalled();
  });

  it("resume writes the change that stop cancelled", async () => {
    const { store, storage, hydrate, persistence } = setup({ strategy: { debounceMs: 1000 } });
    await hydrate();

    store.dispatch(items.actions.add({ id: "a", value: 1 }));
    await persistence.stop();
    persistence.resume();
    await jest.advanceTimersByTimeAsync(1000);

    await expect(storage.get("items")).resolves.toEqual([entry("a", 1)]);
  });

  it("stop waits for the write in progress", async () => {
    const { store, storage, hydrate, persistence } = setup();
    await hydrate();
    const write = { finish: () => {} };
    jest
      .spyOn(storage, "set")
      .mockImplementationOnce(() => new Promise<void>(resolve => (write.finish = resolve)));
    store.dispatch(items.actions.add({ id: "a", value: 1 }));
    await jest.advanceTimersByTimeAsync(0);

    let stopped = false;
    const stopping = persistence.stop().then(() => (stopped = true));
    await jest.advanceTimersByTimeAsync(0);
    expect(stopped).toBe(false);

    write.finish();
    await stopping;
    expect(stopped).toBe(true);
  });
});
