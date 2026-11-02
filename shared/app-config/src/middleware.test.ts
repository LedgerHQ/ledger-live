import { describe, expect, it, jest } from "@jest/globals";
import { configureStore } from "@reduxjs/toolkit";
import { z } from "zod";
import { createAppConfigMiddleware, reloadAppConfig } from "./middleware";
import {
  appConfigDevValueErrorsSelector,
  appConfigReducer,
  appConfigSavedDevValuesSelector,
  appConfigSavedSelectionsSelector,
  appConfigSessionSelector,
  removeAppConfigDevValue,
  resetAppConfigSelection,
  selectAppConfigOption,
  setAppConfigDevValue,
} from "./slice";
import type { AppConfigSession, ConfigOptionId } from "./types";

const switches = {
  backend: {
    label: "Backend",
    options: {
      prod: { apiUrl: "https://api.example.com" },
      staging: { apiUrl: "https://api.stg.example.com" },
    },
  },
  explorer: {
    label: "Explorer",
    options: {
      prod: { explorerUrl: "https://explorer.example.com" },
      staging: { explorerUrl: "https://explorer.stg.example.com" },
    },
  },
};

const declarations = { switches, fixed: { clientVersion: "test/1.0.0" } };

const valueSchemas = { apiUrl: z.url(), explorerUrl: z.url(), clientVersion: z.string() };

describe("createAppConfigMiddleware", () => {
  it("sets the session without its storage and validator once the store is created", async () => {
    const { store, storage } = createStoreBeforeSession({
      defaultOptionId: "staging",
      selections: { backend: "dev" },
      devValues: { apiUrl: "http://localhost:3000" },
    });

    expect(appConfigSessionSelector(store.getState())).toBeNull();
    await Promise.resolve();

    expect(appConfigSessionSelector(store.getState())).toEqual({
      ...declarations,
      default: "staging",
      selections: { backend: "dev" },
      values: {},
      devValues: { apiUrl: "http://localhost:3000" },
    });
    expect(appConfigSavedSelectionsSelector(store.getState())).toEqual({ backend: "dev" });
    expect(appConfigSavedDevValuesSelector(store.getState())).toEqual({
      apiUrl: "http://localhost:3000",
    });
    expect(storage.selections.set).not.toHaveBeenCalled();
  });

  it("saves each selection without reloading", async () => {
    const { store, savedSelections, reload } = await createStore();

    store.dispatch(selectAppConfigOption({ id: "backend", selectionId: "staging" }));
    store.dispatch(selectAppConfigOption({ id: "explorer", selectionId: "staging" }));

    expect(savedSelections()).toEqual({ backend: "staging", explorer: "staging" });
    expect(reload).not.toHaveBeenCalled();
  });

  it("removes a reset selection without reloading", async () => {
    const { store, savedSelections, reload } = await createStore({
      selections: { backend: "staging", explorer: "staging" },
    });

    store.dispatch(resetAppConfigSelection("backend"));

    expect(savedSelections()).toEqual({ explorer: "staging" });
    expect(reload).not.toHaveBeenCalled();
  });

  it("writes nothing for a selection the slice ignores", async () => {
    const { store, storage, savedSelections } = await createStore({
      selections: { backend: "staging" },
    });

    store.dispatch(selectAppConfigOption({ id: "unknown", selectionId: "staging" }));
    store.dispatch(selectAppConfigOption({ id: "clientVersion", selectionId: "staging" }));
    store.dispatch(selectAppConfigOption({ id: "backend", selectionId: "dev" }));
    store.dispatch(resetAppConfigSelection("unknown"));
    // A caller outside TypeScript can dispatch a selection without its selection id.
    store.dispatch({ type: selectAppConfigOption.type, payload: { id: "backend" } });

    expect(storage.selections.set).not.toHaveBeenCalled();
    expect(storage.selections.remove).not.toHaveBeenCalled();
    expect(savedSelections()).toEqual({ backend: "staging" });
  });

  it("saves nothing dispatched before the session is set, which the slice ignores too", async () => {
    const { store, storage, savedSelections } = createStoreBeforeSession({
      defaultOptionId: "staging",
      selections: { backend: "staging" },
    });

    store.dispatch(selectAppConfigOption({ id: "explorer", selectionId: "staging" }));
    store.dispatch(resetAppConfigSelection("backend"));
    store.dispatch(setAppConfigDevValue({ name: "apiUrl", value: "not a url" }));
    await Promise.resolve();

    expect(storage.selections.set).not.toHaveBeenCalled();
    expect(storage.selections.remove).not.toHaveBeenCalled();
    expect(storage.devValues.set).not.toHaveBeenCalled();
    expect(savedSelections()).toEqual({ backend: "staging" });
    expect(appConfigSavedSelectionsSelector(store.getState())).toEqual({ backend: "staging" });
    expect(appConfigDevValueErrorsSelector(store.getState())).toEqual({});
  });

  it("leaves the saved selections unchanged when the storage fails to write", async () => {
    const { store, storage } = await createStore({ selections: { backend: "staging" } });
    const quotaExceeded = new Error("QuotaExceededError");
    storage.selections.set.mockImplementation(() => {
      throw quotaExceeded;
    });
    storage.selections.remove.mockImplementation(() => {
      throw quotaExceeded;
    });

    expect(() =>
      store.dispatch(selectAppConfigOption({ id: "explorer", selectionId: "staging" })),
    ).toThrow(quotaExceeded);
    expect(() => store.dispatch(resetAppConfigSelection("backend"))).toThrow(quotaExceeded);
    expect(appConfigSavedSelectionsSelector(store.getState())).toEqual({ backend: "staging" });
  });

  it("reloads once on reload", async () => {
    const { store, reload } = await createStore();

    store.dispatch(reloadAppConfig());

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("passes any other action on to the reducers unchanged", async () => {
    const { store } = await createStore();
    const action = { type: "accounts/rename", payload: "Savings" };

    expect(store.dispatch(action)).toBe(action);
  });

  describe("dev values", () => {
    it("saves Dev and a valid dev value when the default is staging", async () => {
      const { store, savedSelections, savedDevValues } = await createStore({
        defaultOptionId: "staging",
      });

      store.dispatch(selectAppConfigOption({ id: "backend", selectionId: "dev" }));
      store.dispatch(setAppConfigDevValue({ name: "apiUrl", value: "http://localhost:3000" }));

      expect(savedSelections()).toEqual({ backend: "dev" });
      expect(savedDevValues()).toEqual({ apiUrl: "http://localhost:3000" });
      expect(appConfigSavedDevValuesSelector(store.getState())).toEqual({
        apiUrl: "http://localhost:3000",
      });
    });

    it("saves nothing for an invalid dev value, and records why", async () => {
      const { store, storage } = await createStore({
        defaultOptionId: "staging",
        devValues: { apiUrl: "http://localhost:3000" },
      });

      store.dispatch(setAppConfigDevValue({ name: "apiUrl", value: "not a url" }));

      expect(storage.devValues.set).not.toHaveBeenCalled();
      expect(appConfigSavedDevValuesSelector(store.getState())).toEqual({
        apiUrl: "http://localhost:3000",
      });
      expect(appConfigDevValueErrorsSelector(store.getState())).toEqual({
        apiUrl: { value: "not a url", message: "Invalid URL" },
      });
    });

    it("removes a dev value", async () => {
      const { store, savedDevValues } = await createStore({
        defaultOptionId: "staging",
        devValues: { apiUrl: "http://localhost:3000", clientVersion: "http://dev" },
      });

      store.dispatch(removeAppConfigDevValue("apiUrl"));

      expect(savedDevValues()).toEqual({ clientVersion: "http://dev" });
    });

    it("leaves the saved dev values unchanged when the storage fails to write", async () => {
      const { store, storage } = await createStore({ defaultOptionId: "staging" });
      const quotaExceeded = new Error("QuotaExceededError");
      storage.devValues.set.mockImplementation(() => {
        throw quotaExceeded;
      });

      expect(() =>
        store.dispatch(setAppConfigDevValue({ name: "apiUrl", value: "http://localhost:3000" })),
      ).toThrow(quotaExceeded);
      expect(appConfigSavedDevValuesSelector(store.getState())).toEqual({});
    });
  });
});

type Boot = {
  readonly defaultOptionId?: ConfigOptionId;
  readonly selections?: AppConfigSession["selections"];
  readonly devValues?: AppConfigSession["devValues"];
};

/** Creates a store whose session booted as `boot` says, once the middleware set it. */
async function createStore(boot?: Boot) {
  const created = createStoreBeforeSession(boot);
  await Promise.resolve();
  return created;
}

/** Creates a store whose session boots as `boot` says; the middleware sets it a microtask later. */
function createStoreBeforeSession({
  defaultOptionId = "prod",
  selections = {},
  devValues = {},
}: Boot = {}) {
  const selectionStorage = createConfigStorage(selections);
  const devValueStorage = createConfigStorage(devValues);
  const storage = { selections: selectionStorage.storage, devValues: devValueStorage.storage };
  const reload = jest.fn();
  const store = configureStore({
    reducer: { appConfig: appConfigReducer },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(
        createAppConfigMiddleware({
          session: {
            ...declarations,
            default: defaultOptionId,
            selections,
            values: {},
            devValues,
            valueSchemas,
            storage,
          },
          reload,
        }),
      ),
  });
  return {
    store,
    storage,
    savedSelections: selectionStorage.saved,
    savedDevValues: devValueStorage.saved,
    reload,
  };
}

/** An in-memory `ConfigStorage`, holding `initial` until the middleware writes. */
function createConfigStorage(initial: Readonly<Record<string, string>>) {
  let saved = initial;
  return {
    storage: {
      getAll: jest.fn(() => saved),
      set: jest.fn((key: string, value: string) => {
        saved = { ...saved, [key]: value };
      }),
      remove: jest.fn((key: string) => {
        saved = Object.fromEntries(Object.entries(saved).filter(([name]) => name !== key));
      }),
      clear: jest.fn(() => {
        saved = {};
      }),
    },
    saved: () => saved,
  };
}
