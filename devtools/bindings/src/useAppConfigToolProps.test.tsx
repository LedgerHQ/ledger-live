import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook } from "@testing-library/react";
import {
  appConfigReducer,
  createAppConfigMiddleware,
  defineConfigSchema,
  resolveAppConfig,
  type ConfigOptionId,
  type ConfigSelectionId,
} from "@shared/app-config";
import { useAppConfigToolProps } from "./useAppConfigToolProps";

const schema = defineConfigSchema(z => ({
  switches: { backend: { apiBaseUrl: z.url() } },
  fixed: { clientVersion: z.string().min(1) },
}));

const prodUrl = "https://api.example.com";
const stagingUrl = "https://api.stg.example.com";

const switches = {
  backend: {
    label: "Backend",
    options: { prod: { apiBaseUrl: prodUrl }, staging: { apiBaseUrl: stagingUrl } },
  },
};

describe("useAppConfigToolProps", () => {
  it("should give the default once, each switch and each fixed value with their values", async () => {
    const { result } = await renderToolProps({ selections: { backend: "staging" } });

    expect(result.current.session?.defaultOptionId).toBe("prod");
    expect(result.current.session?.switches).toEqual([
      {
        id: "backend",
        label: "Backend",
        currentSelectionId: "staging",
        savedSelectionId: "staging",
        values: [
          {
            name: "apiBaseUrl",
            currentValue: stagingUrl,
            nextValue: stagingUrl,
          },
        ],
      },
    ]);
    expect(result.current.session?.fixedValues).toEqual([
      {
        name: "clientVersion",
        currentValue: "test/1.0.0",
        nextValue: "test/1.0.0",
        isDevCurrent: false,
        isDevSaved: false,
      },
    ]);
  });

  it("should resolve the dev values when the default is staging", async () => {
    const { result } = await renderToolProps({
      defaultOptionId: "staging",
      selections: { backend: "dev", clientVersion: "dev" },
      devValues: { apiBaseUrl: "http://localhost:3000", clientVersion: "dev/1.0.0" },
    });

    expect(result.current.session?.defaultOptionId).toBe("staging");
    expect(result.current.session?.switches[0]).toMatchObject({
      currentSelectionId: "dev",
      values: [
        {
          currentValue: "http://localhost:3000",
          nextValue: "http://localhost:3000",
        },
      ],
    });
    expect(result.current.session?.fixedValues[0]).toMatchObject({
      currentValue: "dev/1.0.0",
      isDevCurrent: true,
      isDevSaved: true,
    });
  });

  it("should save a selection without reloading, keeping the current one", async () => {
    const { result, savedSelections, reload } = await renderToolProps();

    act(() => result.current.onSelect("backend", "staging"));

    expect(savedSelections()).toEqual({ backend: "staging" });
    expect(reload).not.toHaveBeenCalled();
    expect(result.current.session?.switches[0]).toMatchObject({
      currentSelectionId: "prod",
      savedSelectionId: "staging",
      values: [{ currentValue: prodUrl, nextValue: stagingUrl }],
    });
  });

  it("should remove the saved selection without reloading on reset", async () => {
    const { result, savedSelections, reload } = await renderToolProps({
      selections: { backend: "staging" },
    });

    act(() => result.current.onResetSelection("backend"));

    expect(savedSelections()).toEqual({});
    expect(reload).not.toHaveBeenCalled();
    expect(result.current.session?.switches[0].savedSelectionId).toBeUndefined();
  });

  it("should reload on reload", async () => {
    const { result, reload } = await renderToolProps();

    act(() => result.current.onReloadApp());

    expect(reload).toHaveBeenCalledTimes(1);
  });
});

/** Renders the hook under a store whose app-config middleware holds a session booted as `boot` says. */
async function renderToolProps({
  defaultOptionId = "prod",
  selections = {},
  devValues = {},
}: {
  defaultOptionId?: ConfigOptionId;
  selections?: Readonly<Record<string, ConfigSelectionId>>;
  devValues?: Readonly<Record<string, string>>;
} = {}) {
  const selectionStorage = createConfigStorage(selections);
  const devValueStorage = createConfigStorage(devValues);
  const { session } = resolveAppConfig({
    schema,
    default: defaultOptionId,
    storage: { selections: selectionStorage.storage, devValues: devValueStorage.storage },
    switches,
    fixed: { clientVersion: "test/1.0.0" },
  });
  const reload = jest.fn();
  const store = configureStore({
    reducer: { appConfig: appConfigReducer },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(createAppConfigMiddleware({ session, reload })),
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  const { result } = renderHook(() => useAppConfigToolProps(), { wrapper });
  // Lets the middleware set the session, as it does right after the store is created.
  await act(() => Promise.resolve());
  return {
    result,
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
