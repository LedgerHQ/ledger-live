import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook } from "@testing-library/react";
import {
  appConfigReducer,
  createAppConfigMiddleware,
  type ConfigOptionId,
} from "@shared/app-config";
import { useAppConfigToolProps } from "./useAppConfigToolProps";

const switches = {
  backend: {
    label: "Backend",
    options: {
      prod: { apiBaseUrl: "https://api.example.com" },
      staging: { apiBaseUrl: "https://api.stg.example.com" },
    },
  },
};

/** An in-memory `ConfigStorage`, holding `initial` until the middleware writes. */
function createStorage(initial: Readonly<Record<string, ConfigOptionId>> = {}) {
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

/** Renders the hook under a store whose app-config middleware holds a session booted with `selections`. */
async function renderToolProps(selections: Readonly<Record<string, ConfigOptionId>> = {}) {
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
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  const { result } = renderHook(() => useAppConfigToolProps(), { wrapper });
  // Lets the middleware set the session, as it does right after the store is created.
  await act(() => Promise.resolve());
  return { result, saved, reload };
}

describe("useAppConfigToolProps", () => {
  it("should give the default once and each switch with its current and saved option", async () => {
    const { result } = await renderToolProps({ backend: "staging" });

    expect(result.current.defaultOptionId).toBe("prod");
    expect(result.current.switches).toEqual([
      {
        id: "backend",
        label: "Backend",
        options: [
          { id: "staging", values: { apiBaseUrl: "https://api.stg.example.com" } },
          { id: "prod", values: { apiBaseUrl: "https://api.example.com" } },
        ],
        currentOptionId: "staging",
        savedOptionId: "staging",
      },
    ]);
  });

  it("should save a selected option without reloading, keeping the current one", async () => {
    const { result, saved, reload } = await renderToolProps();

    act(() => result.current.onSelectOption("backend", "staging"));

    expect(saved()).toEqual({ backend: "staging" });
    expect(reload).not.toHaveBeenCalled();
    expect(result.current.switches[0]).toMatchObject({
      currentOptionId: "prod",
      savedOptionId: "staging",
    });
  });

  it("should remove the saved option without reloading on reset", async () => {
    const { result, saved, reload } = await renderToolProps({ backend: "staging" });

    act(() => result.current.onResetSwitch("backend"));

    expect(saved()).toEqual({});
    expect(reload).not.toHaveBeenCalled();
    expect(result.current.switches[0].savedOptionId).toBeUndefined();
  });

  it("should reload on reload", async () => {
    const { result, reload } = await renderToolProps();

    act(() => result.current.onReloadApp());

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
