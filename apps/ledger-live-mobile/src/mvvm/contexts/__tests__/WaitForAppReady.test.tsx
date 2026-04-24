import React from "react";
import { Text } from "react-native";
import { act, render, screen } from "@testing-library/react-native";
import { InitialQueriesContext } from "../InitialQueriesContext";
import { WaitForAppReady, type WaitForAppReadyProps } from "../WaitForAppReady";

type RenderParams = Parameters<typeof InitialQueriesContext.Provider>[0]["value"] &
  Partial<WaitForAppReadyProps>;

describe("WaitForAppReady", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders children when app is ready", async () => {
    await renderApp({
      currencyInitialized: true,
      firebaseIsReady: true,
      ofacResult: { blocked: false, isLoading: false },
    });
    expect(screen.getByText("App is Ready")).toBeTruthy();
  });

  it("renders null when firebase is not ready", async () => {
    await renderApp({
      currencyInitialized: true,
      firebaseIsReady: false,
      ofacResult: { blocked: false, isLoading: false },
    });
    expect(screen.toJSON()).toBeNull();
  });

  it("renders null when OFAC check is loading", async () => {
    await renderApp({
      currencyInitialized: true,
      firebaseIsReady: true,
      ofacResult: { blocked: false, isLoading: true },
    });
    expect(screen.toJSON()).toBeNull();
  });

  it("renders null when currency is not initialized", async () => {
    await renderApp({
      currencyInitialized: false,
      firebaseIsReady: true,
      ofacResult: { blocked: false, isLoading: false },
    });
    expect(screen.toJSON()).toBeNull();
  });

  it("renders null while accounts are being imported", async () => {
    let resolve: (() => void) | undefined;
    await renderApp({
      currencyInitialized: true,
      firebaseIsReady: true,
      ofacResult: { blocked: false, isLoading: false },
      importAccounts: () =>
        new Promise<void>(r => {
          resolve = r;
        }),
    });

    expect(screen.toJSON()).toBeNull();
    resolve?.();
    expect(await screen.findByText("App is Ready")).toBeTruthy();
  });

  async function renderApp({ currencyInitialized, importAccounts, ...value }: RenderParams) {
    let defaultImportAccounts = async () => {};
    const importPromise = importAccounts
      ? null
      : new Promise<void>(resolve => {
          defaultImportAccounts = () => Promise.resolve().finally(resolve);
        });

    render(
      <InitialQueriesContext.Provider value={value}>
        <WaitForAppReady
          currencyInitialized={currencyInitialized ?? true}
          importAccounts={importAccounts ?? defaultImportAccounts}
        >
          <Text>App is Ready</Text>
        </WaitForAppReady>
      </InitialQueriesContext.Provider>,
    );

    if (!importPromise) return;

    // Wait for the import promise and for the state update it triggers.
    await act(() => importPromise);
  }
});
