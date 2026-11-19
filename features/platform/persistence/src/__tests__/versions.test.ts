import { combineReducers, configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { defineRecord } from "@shared/persistence";
import { createMemoryStorage, type StoragePort } from "@shared/storage";
import { createPersistence } from "../createPersistence";
import { persistenceSlice } from "../persistenceSlice";
import type { PersistenceFailure } from "../reportFailure";

// A record that moves from v0 (the shape of today, with no version) to v1. The pattern of the
// shared/persistence README, "Add a version".

type Prefs = { theme: string; fontSize: number };

const prefs = createSlice({
  name: "prefs",
  initialState: { theme: "light", fontSize: 12 } as Prefs,
  reducers: {
    init: (_, action: PayloadAction<Prefs>) => action.payload,
    setTheme: (state, action: PayloadAction<string>) => ({ ...state, theme: action.payload }),
  },
});

const rootReducer = combineReducers({
  prefs: prefs.reducer,
  persistence: persistenceSlice.reducer,
});
type State = ReturnType<typeof rootReducer>;

const state = {
  select: (root: State) => root.prefs,
  toHydrationAction: prefs.actions.init,
};

/** The app of today: v0 stores the theme only, and the font size is not stored. */
const prefsV0 = defineRecord({
  key: "prefs",
  version: 0,
  schema: z => z.strictObject({ theme: z.string() }),
  codec: {
    encode: ({ theme }: Prefs) => ({ theme }),
    decode: ({ theme }) => ({ theme, fontSize: 12 }),
  },
  state,
});

/** The next app: v1 adds a version envelope and stores the font size too. */
const prefsV1 = defineRecord({
  key: "prefs",
  version: 1,
  schema: z =>
    z.union([
      z.strictObject({
        version: z.literal(1),
        data: z.strictObject({ theme: z.string(), fontSize: z.number() }),
      }),
      z.strictObject({ theme: z.string() }),
    ]),
  codec: {
    encode: (slice: Prefs) => ({ version: 1 as const, data: slice }),
    // The migration of a v0 value: it has no version, and no font size.
    decode: stored => ("version" in stored ? stored.data : { theme: stored.theme, fontSize: 12 }),
  },
  state,
});

const settle = async () => {
  for (let tick = 0; tick < 10; tick++) await Promise.resolve();
};

async function startApp(record: typeof prefsV0 | typeof prefsV1, storage: StoragePort) {
  const failures: PersistenceFailure[] = [];
  const persistence = createPersistence<State>({
    storage,
    bindings: [{ record }],
    report: failure => failures.push(failure),
  });
  const store = configureStore({
    reducer: rootReducer,
    middleware: getDefault => getDefault().concat(persistence.middleware),
  });
  const statuses = await persistence.hydrate(store);
  return { store, statuses, failures };
}

describe("a record that moves from v0 to v1", () => {
  it("reads a v0 value, and stores it as v1 at the next change", async () => {
    const storage = createMemoryStorage({ prefs: { theme: "dark" } });

    const { store, statuses } = await startApp(prefsV1, storage);
    expect(statuses).toEqual({ prefs: "loaded" });
    expect(store.getState().prefs).toEqual({ theme: "dark", fontSize: 12 });
    await expect(storage.get("prefs")).resolves.toEqual({ theme: "dark" });

    store.dispatch(prefs.actions.setTheme("blue"));
    await settle();
    await expect(storage.get("prefs")).resolves.toEqual({
      version: 1,
      data: { theme: "blue", fontSize: 12 },
    });
  });

  it("leaves a v1 value to an older app: it does not decode it, and never writes over it", async () => {
    const v1Value = { version: 1, data: { theme: "blue", fontSize: 16 } };
    const storage = createMemoryStorage({ prefs: v1Value });

    const { store, statuses, failures } = await startApp(prefsV0, storage);
    store.dispatch(prefs.actions.setTheme("green"));
    await settle();

    expect(statuses).toEqual({ prefs: "failed" });
    expect(failures).toEqual([expect.objectContaining({ key: "prefs", operation: "decode" })]);
    await expect(storage.get("prefs")).resolves.toEqual(v1Value);
  });
});
