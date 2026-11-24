import { combineReducers, configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { defineRecord, recordVersions } from "@shared/persistence";
import { storedSchemaSnapshot } from "@shared/persistence/testing";
import { createMemoryStorage, type StoragePort } from "@shared/storage";
import { createPersistence } from "../createPersistence";
import { persistenceSlice } from "../persistenceSlice";
import { describePersistenceFailure, type PersistenceFailure } from "../reportFailure";
import prefsV0Sample from "./__fixtures__/prefs.v0.json";
import prefsV1Sample from "./__fixtures__/prefs.v1.json";

type Prefs = { theme: string; fontSize: number };

const prefs = createSlice({
  name: "prefs",
  initialState: { theme: "light", fontSize: 12 } as Prefs,
  reducers: {
    init: (_, action: PayloadAction<Prefs>) => action.payload,
    setTheme: (state, action: PayloadAction<string>) => ({
      ...state,
      theme: action.payload,
    }),
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

const prefsV0Versions = recordVersions(z => z.strictObject({ theme: z.string() }));

const prefsVersions = prefsV0Versions
  // v1, desktop x, mobile y: stores the font size
  .next(
    z => z.strictObject({ theme: z.string(), fontSize: z.number() }),
    v0 => ({ ...v0, fontSize: 12 }),
  );

const olderApp = defineRecord({
  key: "prefs",
  versions: prefsV0Versions,
  codec: {
    encode: ({ theme }: Prefs) => ({ theme }),
    decode: ({ theme }) => ({ theme, fontSize: 12 }),
  },
  state,
});

const app = defineRecord({
  key: "prefs",
  versions: prefsVersions,
  codec: { encode: (slice: Prefs) => slice, decode: stored => stored },
  state,
});

const settle = async () => {
  for (let tick = 0; tick < 10; tick++) await Promise.resolve();
};

async function startApp(record: typeof olderApp | typeof app, storage: StoragePort) {
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
  it("should keep the stored schema of v0", () => {
    expect(storedSchemaSnapshot(app, 0)).toMatchInlineSnapshot(`
      {
        "key": "prefs",
        "schema": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "additionalProperties": false,
          "properties": {
            "theme": {
              "type": "string",
            },
          },
          "required": [
            "theme",
          ],
          "type": "object",
        },
        "version": 0,
      }
    `);
  });

  it("should keep the stored schema of v1", () => {
    expect(storedSchemaSnapshot(app, 1)).toMatchInlineSnapshot(`
      {
        "key": "prefs",
        "schema": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "additionalProperties": false,
          "properties": {
            "$v": {
              "const": 1,
              "type": "number",
            },
            "data": {
              "additionalProperties": false,
              "properties": {
                "fontSize": {
                  "type": "number",
                },
                "theme": {
                  "type": "string",
                },
              },
              "required": [
                "theme",
                "fontSize",
              ],
              "type": "object",
            },
          },
          "required": [
            "$v",
            "data",
          ],
          "type": "object",
        },
        "version": 1,
      }
    `);
  });

  it.each([
    ["v0", prefsV0Sample, { theme: "dark", fontSize: 12 }],
    ["v1", prefsV1Sample, { theme: "dark", fontSize: 16 }],
  ])("should upgrade the %s sample to the latest version", (_version, sample, latest) => {
    expect(prefsVersions.decode(sample, "prefs")).toEqual(latest);
  });

  it("should read a v0 value, keep it v0 after the hydration, and store v1 at the next change", async () => {
    const storage = createMemoryStorage({ prefs: { theme: "dark" } });

    const { store, statuses } = await startApp(app, storage);
    expect(statuses).toEqual({ prefs: "loaded" });
    expect(store.getState().prefs).toEqual({ theme: "dark", fontSize: 12 });
    await expect(storage.get("prefs")).resolves.toEqual({ theme: "dark" });

    store.dispatch(prefs.actions.setTheme("blue"));
    await settle();
    await expect(storage.get("prefs")).resolves.toEqual({
      $v: 1,
      data: { theme: "blue", fontSize: 12 },
    });
  });

  it("should leave a v1 value to an older app, which shows the default and never writes over it", async () => {
    const v1Value = { $v: 1, data: { theme: "blue", fontSize: 16 } };
    const storage = createMemoryStorage({ prefs: v1Value });

    const { store, statuses, failures } = await startApp(olderApp, storage);
    expect(store.getState().prefs).toEqual({ theme: "light", fontSize: 12 });
    store.dispatch(prefs.actions.setTheme("green"));
    await settle();

    expect(statuses).toEqual({ prefs: "failed" });
    expect(failures).toEqual([
      { key: "prefs", version: 0, operation: "newer", reason: expect.any(String) },
    ]);
    await expect(storage.get("prefs")).resolves.toEqual(v1Value);
  });

  it("should describe a newer value with its stored version and no value", async () => {
    const { failures } = await startApp(
      olderApp,
      createMemoryStorage({ prefs: { $v: 1, data: { theme: "secret-theme", fontSize: 16 } } }),
    );

    expect(failures.map(describePersistenceFailure)).toEqual([
      'Persistence found a newer version of record "prefs" v0: Stored value of record "prefs" is v1, newer than the known v0',
    ]);
  });
});
