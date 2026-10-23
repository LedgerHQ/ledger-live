import { describe, expect, it, jest } from "@jest/globals";
import { configureStore } from "@reduxjs/toolkit";
import { createAppConfigMiddleware, reloadAppConfig } from "./middleware";
import {
  appConfigReducer,
  appConfigSavedSelectionsSelector,
  appConfigSessionSelector,
  resetAppConfigSwitch,
  selectAppConfigOption,
} from "./slice";
import type { ConfigOptionId } from "./types";

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

/** An in-memory `ConfigStorage`, holding `initial` until the middleware writes. */
function createStorage(initial: Readonly<Record<string, ConfigOptionId>>) {
  let saved = initial;
  return {
    storage: {
      getAll: jest.fn(() => saved),
      set: jest.fn((key: string, value: ConfigOptionId) => {
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

/** Creates a store whose session boots with `selections` saved; the middleware sets it a microtask later. */
function createStoreBeforeSession(selections: Readonly<Record<string, ConfigOptionId>> = {}) {
  const { storage, saved } = createStorage(selections);
  const reload = jest.fn();
  const store = configureStore({
    reducer: { appConfig: appConfigReducer },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(
        createAppConfigMiddleware({
          session: { switches, default: "prod", selections, storage },
          reload,
        }),
      ),
  });
  return { store, storage, saved, reload };
}

/** Creates a store whose session booted with `selections` saved, once the middleware set it. */
async function createStore(selections: Readonly<Record<string, ConfigOptionId>> = {}) {
  const created = createStoreBeforeSession(selections);
  await Promise.resolve();
  return created;
}

describe("createAppConfigMiddleware", () => {
  it("sets the session without its storage once the store is created", async () => {
    const { storage, saved } = createStorage({ backend: "staging" });
    const store = configureStore({
      reducer: { appConfig: appConfigReducer },
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware().concat(
          createAppConfigMiddleware({
            session: { switches, default: "prod", selections: saved(), storage },
            reload: jest.fn(),
          }),
        ),
    });

    expect(appConfigSessionSelector(store.getState())).toBeNull();
    await Promise.resolve();

    expect(appConfigSessionSelector(store.getState())).toEqual({
      switches,
      default: "prod",
      selections: { backend: "staging" },
    });
    expect(appConfigSavedSelectionsSelector(store.getState())).toEqual({ backend: "staging" });
    expect(storage.set).not.toHaveBeenCalled();
  });

  it("saves each selection without reloading", async () => {
    const { store, saved, reload } = await createStore();

    store.dispatch(selectAppConfigOption({ switchId: "backend", optionId: "staging" }));
    store.dispatch(selectAppConfigOption({ switchId: "explorer", optionId: "staging" }));

    expect(saved()).toEqual({ backend: "staging", explorer: "staging" });
    expect(reload).not.toHaveBeenCalled();
  });

  it("removes a reset selection without reloading", async () => {
    const { store, saved, reload } = await createStore({ backend: "staging", explorer: "staging" });

    store.dispatch(resetAppConfigSwitch("backend"));

    expect(saved()).toEqual({ explorer: "staging" });
    expect(reload).not.toHaveBeenCalled();
  });

  it("writes nothing for a selection the slice ignores", async () => {
    const { store, storage, saved } = await createStore({ backend: "staging" });

    store.dispatch(selectAppConfigOption({ switchId: "unknown", optionId: "staging" }));
    store.dispatch(resetAppConfigSwitch("unknown"));
    // A caller outside TypeScript can dispatch a selection without its option id.
    store.dispatch({ type: selectAppConfigOption.type, payload: { switchId: "backend" } });

    expect(storage.set).not.toHaveBeenCalled();
    expect(storage.remove).not.toHaveBeenCalled();
    expect(saved()).toEqual({ backend: "staging" });
  });

  it("saves nothing dispatched before the session is set, which the slice ignores too", async () => {
    const { store, storage, saved } = createStoreBeforeSession({ backend: "staging" });

    store.dispatch(selectAppConfigOption({ switchId: "explorer", optionId: "staging" }));
    store.dispatch(resetAppConfigSwitch("backend"));
    await Promise.resolve();

    expect(storage.set).not.toHaveBeenCalled();
    expect(storage.remove).not.toHaveBeenCalled();
    expect(saved()).toEqual({ backend: "staging" });
    expect(appConfigSavedSelectionsSelector(store.getState())).toEqual({ backend: "staging" });
  });

  it("leaves the saved selections unchanged when the storage fails to write", async () => {
    const { store, storage } = await createStore({ backend: "staging" });
    const quotaExceeded = new Error("QuotaExceededError");
    storage.set.mockImplementation(() => {
      throw quotaExceeded;
    });
    storage.remove.mockImplementation(() => {
      throw quotaExceeded;
    });

    expect(() =>
      store.dispatch(selectAppConfigOption({ switchId: "explorer", optionId: "staging" })),
    ).toThrow(quotaExceeded);
    expect(() => store.dispatch(resetAppConfigSwitch("backend"))).toThrow(quotaExceeded);
    expect(appConfigSavedSelectionsSelector(store.getState())).toEqual({ backend: "staging" });
  });

  it("reloads once on reload", async () => {
    const { store, reload } = await createStore();

    store.dispatch(reloadAppConfig());

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
